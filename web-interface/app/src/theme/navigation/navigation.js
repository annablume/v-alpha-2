const Navigation = ( function() { // eslint-disable-line no-unused-vars

  /**
  * Module driving the app's navigation
  *
  *
  */

  'use strict';

  const DOM = {};

  /* ================== private methods ================= */

  function cacheDom() {
    DOM.$nav = V.getNode( 'nav' );
    DOM.$entities = V.getNode( 'entities' );
  }

  function checkCookies() {
    const navState = V.getCookie( 'nav-state' );
    const navItems = Object.values( V.getState( 'navItems' ) );
    if ( !navState || JSON.parse( navState ).length != navItems.length ) {
      V.setCookie( 'nav-state', navItems );
    }

    const entitiesState = V.getCookie( 'entities-state' );
    const entitiesItems = DemoContent.entitiesNavArr;

    if ( !entitiesState || JSON.parse( entitiesState ).length != entitiesItems.length ) {
      V.setCookie( 'entities-state', entitiesItems );
    }
  }

  function presenter( which, options ) {
    if ( options.reset ) { return { reset: true } }

    const rowData = JSON.parse( V.getCookie( which + '-state' ) ); // Row-Cookie was set in checkCookies()

    let $rowUl;

    if ( which == 'entities' ) {
      $rowUl = NavComponents.entitiesUl();
    }
    else if ( which == 'nav' ) {
      $rowUl = NavComponents.navUl();
    }

    const orderedRow = rowData.sort( function( a, b ) {
      return a.l - b.l;
    } );
    const weightedRow = orderedRow.slice( options.keep ).sort( function( a, b ) {
      return b.c - a.c;
    } );
    const combinedRow = orderedRow.slice( 0 ).splice( 0, options.keep ).concat( weightedRow );

    for ( let i = 0; i < combinedRow.length; i++ ) {
      const $pill = NavComponents.pill( combinedRow[i] );
      V.setNode( $rowUl, $pill );
    }

    return { row: which, ul: $rowUl };
  }

  function view( rowData ) {
    if ( rowData.reset ) {
      reset();
      return;
    }

    rowData.ul.addEventListener( 'click', menuItemClickHandler );

    if ( rowData.row == 'entities' ) {
      V.setNode( DOM.$entities, rowData.ul );
    }
    else if ( rowData.row == 'nav' ) {
      V.setNode( DOM.$nav, rowData.ul );
    }

    function menuItemClickHandler( e ) {

      /**
      * Private function to arrange the menu after an item has been clicked
      * gets and sets the app' menu state
      *
      */

      e.stopPropagation(); // no need to bubble any further

      const $itemClicked = ( ( e ) => {
        //In case svg is used in the pill, return the correct li clicked
        const t = e.target;
        if ( t.localName == 'li' ) { return t }
        else if ( t.localName == 'svg' ) { return t.parentNode }
        else if ( t.localName == 'path' ) { return t.parentNode.parentNode }
      } )( e );

      if ( $itemClicked ) {

        const menuStateObj = V.getState( 'menu' );
        const row = $itemClicked.parentNode.parentNode.localName;
        const itemClickedRect = $itemClicked.getBoundingClientRect();
        const otherRow = row == 'nav' ? 'entities' : 'nav';

        select( $itemClicked );
        movingPillAnimation( row, $itemClicked, itemClickedRect, menuStateObj );

        V.sA( otherRow, { height: 0, width: 0 }, { duration: 1 } );
        V.setAnimation( row, {
          // scrollLeft: 0,
          width: itemClickedRect.width + 11,
          top: menuStateObj.entitiesTop,
          left: menuStateObj.entitiesLeft
        }, { duration: 1 } );
        V.getNode( row ).scrollLeft = 0;

        drawContentForItemClicked( $itemClicked );

        // TODO: using setTimeout is questionable, use promises instead?
        setTimeout( () => {return updateCookies( row )}, 1000 );

      } // end if $itemClicked

      function drawContentForItemClicked( $itemClicked ) {
        const itemId = $itemClicked.getAttribute( 'idfy' );
        if ( itemId > 1000 ) {

          Chat.draw();
          Button.draw( 'search' );

        }
        else {

          Page.draw( { active: true } );

          // const converted = V.castCamelCase( V.getState( 'menu' ).activeTitle );
          // const buttons = V.getState( 'navItems' )[converted].use.button;

          Button.draw( V.getNavItem( 'active' ).use.button, { delay: 2 } );
        }
      }

      function updateCookies( row ) {
        const $rowAfter = V.getNode( row + ' > ul' ).childNodes;
        const cookieMenu = JSON.parse( V.getCookie( row + '-state' ) );

        for ( let i = 0; i < $rowAfter.length; i++ ) {
          const $li = $rowAfter[i];
          for ( let j = 0; j < cookieMenu.length; j++ ) {
            if ( cookieMenu[j].title == $li.innerHTML ) {
              $li.classList.contains( 'pill--selected' ) ? cookieMenu[j].c += 1 : null;
              cookieMenu[j].l = i;
              break;
            }
          }
        }

        V.setCookie( row + '-state', cookieMenu );

        // debug
        // JSON.parse( V.getCookie( row + '-state' ) ).forEach( item => {
        //   console.log( item );
        // } );
      }

      function movingPillAnimation( row, $itemClicked, itemClickedRect, menuStateObj ) {
        // adjusted from LukePH https://stackoverflow.com/questions/907279/jquery-animate-moving-dom-element-to-new-parent

        let classes = ' absolute font-medium';
        if ( $itemClicked.getAttribute( 'idfy' ) > 1000 ) {
          classes += ' fs-rr';
        }

        const $tempMover = $itemClicked.cloneNode( true );
        $tempMover.className += classes;
        $tempMover.style.left = itemClickedRect.left + 'px';
        $tempMover.style.top = itemClickedRect.top + 'px';
        // $tempMover.style.zIndex = 510;
        V.getNode( 'body' ).appendChild( $tempMover );

        V.setAnimation( $tempMover, {
          top: menuStateObj.entitiesTop + 4,
          left: menuStateObj.entitiesLeft + 3
        }, {
          duration: 2
        } ).then( () => {
          $itemClicked.style.visibility = 'visible';
          $tempMover.remove();
        } );

        $itemClicked.style.visibility = 'hidden';
        V.getNode( row + ' > ul' ).prepend( $itemClicked );

      }

    } // end menuItemClickHandler
  }

  function select( $itemClicked ) {
    $itemClicked.className += ' pill--selected';
    $itemClicked.addEventListener( 'click', pillSelectedClickHandler, { once: true } );

    V.setState( 'menu', { activeTitle: $itemClicked.innerHTML } );
  }

  function deselect() {
    const $itemSelected = document.getElementsByClassName( 'pill--selected' ); // $( 'header' ).find( '.pill--selected:first' );
    if ( $itemSelected.length ) {
      $itemSelected[0].removeEventListener( 'click', pillSelectedClickHandler );
      $itemSelected[0].classList.remove( 'pill--selected' ); // .removeClass( 'pill--selected' );

      V.setState( 'menu', { activeTitle: false } );
    }
  }

  function pillSelectedClickHandler( e ) {
    e.stopPropagation();
    reset();
    Page.draw( { position: 'closed', reset: false } );

  }

  function reset() {

    const menuStateObj = V.getState( 'menu' );
    const width = window.innerWidth;
    const defaultHeight = 48; // TODO: this is unclean: initially no height is set

    deselect( menuStateObj );

    V.getNode( 'entities' ).scrollLeft = 0;
    V.getNode( 'nav' ).scrollLeft = 0;

    V.setAnimation( 'entities', {
      // scrollLeft: 0,
      height: defaultHeight,
      width: width
    }, { duration: 1 } );

    V.setAnimation( 'nav', {
      // scrollLeft: 0,
      height: defaultHeight,
      width: width,
      top: menuStateObj.navTop,
      left: menuStateObj.navLeft
    }, { duration: 2 } );

    Feature.draw( { fade: 'out' } );
    Haze.draw( { fade: 'out' } );
    Form.draw( 'all', { fade: 'out' } );
    Button.draw( 'all', { fade: 'out' } );
    Chat.drawMessageBox( 'clear' );

  }

  /* ============ public methods and exports ============ */

  function launch() {
    cacheDom();
    checkCookies();
  }

  function draw( which, options ) {
    view( presenter( which, options ) );
  }

  return {
    launch: launch,
    draw: draw
  };

} )();
