
( function() { // eslint-disable-line no-unused-vars

  /**
   * Send console logs to server for debugging
   *
   */

  Object.assign( window.console, {
    log: handleConsoleMessage,
    error: handleConsoleMessage,
    warn: handleConsoleMessage,
  } );

  const sessionNr = Date.now();

  console.log( '============ NEW SESSION ============' );
  console.log( '===== App  ', 'v2.1' );
  console.log( '===== Date ', new Date() );

  function handleConsoleMessage( msg, data ) {
    fetch( /* 'http://localhost:6021/logs' */ 'https://mongodb.valueinstrument.org/logs', {
      method: 'POST', // or 'PUT'
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify( sessionNr + ' // ' + String( new Date() ).substr( 16, 8 ) + ' // '+ msg + ( data ? ' ' + JSON.stringify( data ) : '' )  ),
    } );
  }
} )();

const V = {

  /**
   * Global Object for all V Core Methods to become
   * accessible via V.someMethod( param )
   *
   */

};

( async function() { // eslint-disable-line no-unused-vars

  /**
   * V Core Initialization Module
   *
   * - load all V Core modules, relevant ledger modules and methods
   * - load V Theme Canvas
   * - draw the first app view
   *
   */

  'use strict';

  V.setScript = setScript;
  V.setStylesheet = setStylesheet;

  await launchScripts();

  await kickAss();

  /* ================== private methods ================= */

  async function launchScripts() {
    await Promise.all( [
      setScript( '/dist/velocity.min.js' ),
      // setScript( '/dist/moment.min.js' ),
      setScript( '/dist/js.cookie.min.js' ),
      setScript( '/dist/universal-router.js' )
    ] );
    console.log( '*** vcore dependencies loaded ***' );

    await Promise.all( [
      setScript( '/src/vcore/v/v-translations.js' )
    ] );
    console.log( '*** translations loaded ***' );

    await Promise.all( [
      setScript( '/src/vcore/dom/v-dom.js' ),
      setScript( '/src/vcore/state/v-state.js' ),
      setScript( '/src/vcore/v/v-key.js' ),
      setScript( '/src/vcore/v/v-setup.js' ),
      setScript( '/src/vcore/dom/v-route.js' ),
      setScript( '/src/vcore/helper/v-debugger.js' ),
      setScript( '/src/vcore/helper/v-helper.js' )
    ] );
    console.log( '*** vcore scripts (1) loaded ***' );

    await Promise.all( [
      setScript( '/src/vcore/ledger/v-ledger.js' ),
      setScript( '/src/vcore/endpoint/v-entity.js' ),
      setScript( '/src/vcore/endpoint/v-message.js' ),
      setScript( '/src/vcore/endpoint/v-transaction.js' ),

      /**
       * Also load the canvas script (the first theme script)
       * to enable theme-initialization
       *
       */

      setScript( '/src/theme/canvas/canvas.js' ),
    ] );
    console.log( '*** vcore scripts (2) loaded ***' );

  }

  async function kickAss() {

    /**
    * Launch ledger-specific VCore scripts and methods,
    *
    */

    await VLedger.launch();

    /**
    * Launch the Canvas
    *
    */

    await Canvas.launch();

    /**
    * Draw the first view
    *
    */

    Canvas.draw( {
      path: window.location.pathname
    } );

  }

  /* ================== public methods ================== */

  function setScript( src, id ) {
    // console.log( src );
    return new Promise( function( resolve, reject ) {
      const s = document.createElement( 'script' );
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      id ? s.id = id : null;
      document.head.appendChild( s );
    } );
  }

  function setStylesheet( src ) {
    return new Promise( function( resolve, reject ) {
      const l = document.createElement( 'link' );
      l.type = 'text/css';
      l.rel = 'stylesheet';
      l.href = src;
      l.onload = resolve;
      l.onerror = reject;
      document.head.appendChild( l );
    } );
  }

} )();
