const VLaunch = ( async function() { // eslint-disable-line no-unused-vars

  /* ============== user interface strings ============== */

  const ui = {
    ledgerLoad: 'Connecting to ledger',
    themeLoad: 'Setting up the theme',
    pluginsLoad: 'Initializing network\'s plugins'
  };

  function getString( string, scope ) {
    return V.i18n( string, 'launch', scope || 'launch content' ) + ' ';
  }

  /**
    * Launch ledger-specific VCore scripts and methods,
    * and get entities for initial view
    */

  V.setNode( 'loader', getString( ui.ledgerLoad ) );

  await VLedger.launch();

  V.setCache( 'preview', { data: [] } );

  V.getEntity( 'preview' ).then( res => {
    res.data.forEach( entity => {
      entity.path = V.castPathOrId( entity.fullId );
      entity.type = 'Feature'; // needed to populate entity on map
      entity.properties ? null : entity.properties = {};
    } );

    V.setCache( 'preview', res.data );
  } );

  /**
   * Also load the canvas script (the first theme script)
   * to enable theme-initialization
   *
   */

  V.setNode( 'loader', getString( ui.themeLoad ) );

  if( V.getSetting( 'useBuilds' ) ) {
    await Promise.all( [
      V.setScript( '/theme/builds/vtheme.min.js' )
    ] );
    console.log( '*** theme builds loaded ***' );
  }
  else {
    await Promise.all( [
      V.setScript( '/theme/src/canvas/canvas.js' ),
    ] );
  }

  /**
    * Launch the Canvas
    *
    */

  V.setNode( 'loader', getString( ui.pluginsLoad ) );

  clearTimeout( preloaderTimeout );

  await Canvas.launch();

  /**
    * Draw the first view
    *
    */

  Canvas.draw( {
    path: window.location.pathname
  } );

} )();
