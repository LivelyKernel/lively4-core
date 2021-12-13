function show() {
  var hint = lively.showElement(this);
  hint.style.zIndex = '100000000000';
}
function click() {
  // this::show();
  const e = new MouseEvent("click", {
    // view: window,
    bubbles: true,
    cancelable: true
  });
  this.dispatchEvent(e);
}

(async () => {

  const BERICHTIGEN = await lively.sleepUntil(() => {
    let tableRows = document.querySelectorAll('tr.dxgvDataRow_OEMSN');
    const tr = tableRows.find(tr => tr.innerHTML.includes('Abwesend trotz Sollzeit') && tr.children[6].children.length === 0);
    return tr && tr.querySelector('img.dx-vam');
  }, 0, 300);
  BERICHTIGEN::click();

  const NACHERFASSEN = await lively.sleepUntil(() => {
    return document.querySelectorAll('div.dxbButton_OEMSN.dxbButtonSys.dxbTSys').find(e => e.innerText.includes('Anwesenheit nacherfassen'));
  }, 1500, 300);
  NACHERFASSEN::click();

  const IFRAME = await lively.sleepUntil(() => {
    return document.querySelector("iframe")
  }, 1500, 300);
  const SUB_DOC = IFRAME.contentDocument

  const INC_START = await lively.sleepUntil(() => {
    return SUB_DOC.querySelector('#ctl00_content1_ctl00_pnlAntrag_frmAntrag_fldDetails_fldStart_teStart_B-2')
  }, 30000, 300);
  INC_START::click()
  
  const DEC_END = await lively.sleepUntil(() => {
    return SUB_DOC.querySelector('#ctl00_content1_ctl00_pnlAntrag_frmAntrag_fldDetails_fldEnd_teEnd_B-3')
  }, 30000, 300);
  for (let i of 0 .to(13)) {
    DEC_END::click()
    await lively.sleep(500)
  }

  const BEMERKUNGEN = await lively.sleepUntil(() => {
    return SUB_DOC.querySelector('#ctl00_content1_ctl00_pnlAntrag_frmAntrag_fldDetails_fldRemark_tbBemerkung_I')
  }, 30000, 300);
  BEMERKUNGEN.focus()

  await lively.sleep(500)
  const ABSCHICKEN = await lively.sleepUntil(() => {
    return SUB_DOC.querySelector('#ctl00_content1_ctl00_pnlAntrag_frmAntrag_btnBeantragen_CD')
  }, 30000, 300);
  ABSCHICKEN::click()
  
  await lively.sleep(2000)
  const CLOSE = await lively.sleepUntil(() => {
    return document.querySelector('#ctl00_phContent_0_control_gvErrors_DXPEForm_HCB-1')
  }, 1500, 300);
  CLOSE::click();
})();
