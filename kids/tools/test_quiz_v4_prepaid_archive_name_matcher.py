#!/usr/bin/env python3
"""Pure filename contract for historical already-paid V4 MP3 backup archives.

No network access, no generated or dummy MP3, no ElevenLabs calls. Validates
only the source identifier naming convention: original-id.mp3 and the already
supported original-id_description.mp3 / original-id-description.mp3.
"""
from __future__ import annotations
import json
from pathlib import Path
from recover_quiz_v4_nine_from_github_action_archives import (
    original_id_from_export_name, sample_historical_archives,
    disjoint_second_pass_samples, SECOND_PASS_SAMPLES_PER_NAME,
    MAX_SAMPLES_PER_NAME, ROOT)

def main():
    state=json.loads((ROOT/"kids/data/quiz-v4-paid-flow-import-status.json").read_text(encoding="utf-8"))
    paid=set(state["remainingGenerationIds"])
    assert len(paid)==state["remainingPriorPaidGenerations"]<=9
    for gid in paid:
        assert len(gid)==20 and gid.isalnum()
        for example in (gid+".mp3",gid+"-original.mp3",
                        gid+"_flow-paid-eleven-v4.mp3",
                        "audio/"+gid+".mp3",
                        "audio/"+gid+"_historic-original.mp3"):
            assert original_id_from_export_name(example,paid)==gid,example
        for refused in (gid+".mp3.txt",gid+"-edit.wav",
                        gid+".wav",gid+"-not-original.mp4",
                        gid+"-trailing-over-70-characters-"+("A"*80)+".mp3",
                        "other-generation.mp3"):
            assert original_id_from_export_name(refused,paid) is None,refused
    assert original_id_from_export_name("aaaaaaaaaaaaaaaaaaaa.mp3",set()) is None
    assert original_id_from_export_name("aaaaaaaaaaaaaaaaaaaa.mp3",paid) is None
    # Stop the old regression: scanning only the newest 48 backups could
    # consume the full 300 MB budget without inspecting historic originals.
    hundred=[{"id":i,"created_at":"historical-simulated-index"}
             for i in range(100)]
    spread=sample_historical_archives(hundred)
    assert len(spread)==MAX_SAMPLES_PER_NAME==6
    assert spread[0]["id"]==0 and spread[-1]["id"]==99
    assert len({x["id"] for x in spread})==6
    assert len([x for x in spread if 20<=x["id"]<=80])>=3
    assert sample_historical_archives([])==[]
    # Second pass looks only at unseen archive identities. Old results retain
    # their identifiers and are neither fabricated nor silently replaced.
    more=disjoint_second_pass_samples(hundred)
    assert len(more)==SECOND_PASS_SAMPLES_PER_NAME==16
    assert not ({a["id"] for a in more} & {a["id"] for a in spread})
    assert len({a["id"] for a in more})==16
    assert disjoint_second_pass_samples([])==[]
    assert len(disjoint_second_pass_samples(hundred[:5]))==0

    assert [x["id"] for x in sample_historical_archives(hundred[:3])]==[0,1,2]
    # Each named source family gets a bounded representative group, never
    # an entire 48-item quota solely from its newest snapshots.
    three_lanes={"legacy-A":hundred,"legacy-B":hundred,
                 "legacy-C":hundred}
    sampled={name:sample_historical_archives(rows)
             for name,rows in three_lanes.items()}
    assert all(len(rows)==6 for rows in sampled.values())
    print("PASS: all historical generation IDs recognize only allowed original MP3 export names; "
          "zero synthesized audio, no provider calls, no credits")

if __name__=="__main__":
    main()
