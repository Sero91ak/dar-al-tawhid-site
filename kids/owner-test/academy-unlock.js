/* KIDS_OWNER_TEST_ACADEMY_V1
 * Only injected by the separate, authenticated OWNER TEST worker.
 * Allows every implemented lesson in test without touching public unlocks.
 */
(function(){
 "use strict";
 if(location.hostname!=="dar-al-tawhid-kids-owner-test.sero91ak.workers.dev"||
    window.__DAR_KIDS_OWNER_TEST__!==true)return;
 const school=window.DARKidsAcademySchool;
 if(!school||typeof school.evaluate!=="function")return;
 const original=school.evaluate.bind(school);
 window.DARKidsAcademySchool=Object.freeze({
  ...school,
  evaluate(input){
   const state=original(input);
   const known=new Set(state.ids||[]);
   const first=state.ids?.[0]||null;
   const next=state.active||state.upcoming||first;
   return {...state,
    active:next,recommendation:next,kind:"new",canOpenNew:true,
    nextUnlockHint:"Ersteller-Test: Alle vorhandenen Lektionen sind freigeschaltet.",
    access(id){
     if(!known.has(id))return "unknown";
     return state.access(id)==="review"?"review":"new";
    }
   };
  }
 });
})();
