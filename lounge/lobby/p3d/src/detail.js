let DETAIL=1;const setDetail=k=>{DETAIL=k};const seg=n=>DETAIL===1||n<=6?n:Math.max(6,Math.round(n*DETAIL));export{DETAIL,seg,setDetail};
