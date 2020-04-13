const V = ( function() { // eslint-disable-line no-unused-vars

  /**
  * Module to make V's core methods accessible
  * through e.g. "V.methodNameHere()"
  *
  */

  'use strict';

  async function kicksAss() {
    await VLedger.launch();
    Canvas.launch();
  }

  return {
    kicksAss: kicksAss,

    /* Action */
    getEntity: VEntity.getEntity,
    setEntity: VEntity.setEntity,
    getEntityBalance: VEntity.getEntityBalance,

    getMessage: VMessage.getMessage,
    setMessage: VMessage.setMessage,
    setMessageBot: VMessage.setMessageBot,

    getTransaction: VTransaction.getTransaction,
    setTransaction: VTransaction.setTransaction,

    /* DOM */
    castNode: VDom.castNode,
    cN: VDom.cN,
    setNode: VDom.setNode,
    sN: VDom.sN,
    getNode: VDom.getNode,
    gN: VDom.gN,
    setAnimation: VDom.setAnimation,
    sA: VDom.sA,
    setStyle: VDom.setStyle,
    setClick: VDom.setClick,
    getCss: VDom.getCss,
    castRemToPixel: VDom.castRemToPixel,

    /* Helper */
    castEntityTitle: VEntity.castEntityTitle,
    castInitials: VHelper.castInitials,
    castCamelCase: VHelper.castCamelCase,
    castLinks: VHelper.castLinks,
    castTime: VHelper.castTime,
    castShortAddress: VHelper.castShortAddress,
    setPipe: VHelper.setPipe,
    getTranslation: VHelper.getTranslation,
    i18n: VHelper.i18n,
    getIcon: VHelper.getIcon,
    debug: VDebugHelper.debug,

    /* Ledger */
    getData: VLedger.getData,
    setData: VLedger.setData,

    /* State */
    getState: VState.getState,
    setState: VState.setState,
    getNavItem: VState.getNavItem,
    setNavItem: VState.setNavItem,
    getCookie: VState.getCookie,
    setCookie: VState.setCookie,

    /* Settings */
    getSetting: VInit.getSetting,
    getNetwork: VInit.getNetwork,
    getApiKey: VKey.getApiKey,

    /* Web3 */
    set3BoxSpace: VWeb3.set3BoxSpace,
    get3BoxSpace: VWeb3.get3BoxSpace,
    setActiveAddress: VWeb3.setActiveAddress,
    getContractState: VWeb3.getContractState,
    getAddressState: VWeb3.getAddressState,
    getAddressHistory: VWeb3.getAddressHistory,
    setAddressVerification: VWeb3.setAddressVerification,
    setCoinTransaction: VWeb3.setCoinTransaction,
    setTokenTransaction: VWeb3.setTokenTransaction,

  };

} )();
