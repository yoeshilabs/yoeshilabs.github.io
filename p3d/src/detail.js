export let DETAIL=1;export const setDetail=k=>{DETAIL=k};export const seg=n=>DETAIL===1||n<=6?n:Math.max(6,Math.round(n*DETAIL));
