const Button = ( function() { // eslint-disable-line no-unused-vars
  /**
  * Create buttons
  *
  *
  */

  'use strict';

  const DOM = {};

  /* ================== private methods ================= */

  function cacheDom() {
    // DOM.$backUL = V.getNode( 'back > ul' );
    DOM.$interactionsUL = V.getNode( 'interactions > ul' );
    DOM.$join = V.getNode( 'body' );
  }

  function setButtonNodes() {

    // const $back = InteractionComponents.back();
    const $filter = InteractionComponents.filter();
    const $search = InteractionComponents.searchBtn();
    const $plus = InteractionComponents.plus();
    const $send = InteractionComponents.send();
    const $close = InteractionComponents.close();

    // $back.addEventListener( 'click', function() {
    //   Page.draw( { pos: 'closed' } );
    //   Navigation.draw( 'all', { reset: true } );
    // } );
    $plus.addEventListener( 'click', function() {
      Page.draw( { position: 'close', reset: false } );
      Form.draw( V.getNavItem( 'active' ).use.form );
    } );
    $search.addEventListener( 'click', function() {
      Form.draw( 'search' );
    } );
    $close.addEventListener( 'click', function() {
      Form.draw( 'all', { fade: 'out' } );
      Button.draw( 'all', { fade: 'out' } );
      Button.draw( V.getNavItem( 'active' ).use.button, { delay: 1.5 } );
      Page.draw( { position: 'peek', reset: false } );
    } );
    $send.addEventListener( 'click', function() {
      const role = V.getNavItem( 'active' ).role;
      const form = V.getNode( 'form' );
      const title = form.getNode( '.plusform__title' ).value;
      const entityData = {
        title: title,
        role: role,
        location: form.getNode( '.plusform__loc' ).value,
        lat: form.getNode( '#plusform__lat' ).value || undefined,
        lng: form.getNode( '#plusform__lng' ).value || undefined,
        description: form.getNode( '.plusform__desc' ).value,
        unit: form.getNode( '.plusform__unit' ).value,
        target: form.getNode( '.plusform__target' ).value
      };

      V.setEntity( entityData ).then( res => {
        if ( res.success ) {
          Page.draw( { active: true } );
          Form.draw( { fade: 'out' } );
          Button.draw( 'all', { fade: 'out' } );
          Button.draw( 'plus search', { delay: 1 } );
          console.log( res.status );
        }
        else if ( res.status == 'invalid title' ) {
          Form.draw( { error: 'invalid title' } );
          console.error( res.status );
        }
        else {
          Form.draw( { error: 'check console' } );
          console.error( 'try again, because: ', res.status );
        }
      } );

    } );

    // V.setNode( DOM.$backUL, $back );
    V.setNode( DOM.$interactionsUL, [ $close, $plus, $filter, $search, $send ] );
  }

  function presenter( which, options ) {
    const btnArr = which == 'all' ? ['filter', 'search', 'plus', 'close', 'send'] : which.split( ' ' );
    return {
      btnArr: btnArr,
      options: options
    };
  }

  function view( set ) {
    let fade = 'fadeIn', delay = 0.2;
    set.options && set.options.fade == 'out' ? fade = 'fadeOut' : null;
    set.options && set.options.delay ? delay = set.options.delay : null;
    set.btnArr.forEach( btn => {
      V.setAnimation( '#' + btn, fade, { delay: delay, duration: 1 } );
    } );
  }

  /* ============ public methods and exports ============ */

  function launch() {
    cacheDom();
    setButtonNodes();
  }

  function draw( which, options ) {
    view( presenter( which, options ) );
  }

  return {
    launch: launch,
    draw: draw
  };

} )();
