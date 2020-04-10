const Chat = ( function() { // eslint-disable-line no-unused-vars

  /**
  * Module driving the chat
  *
  *
  */

  'use strict';

  V.setNavItem( 'entityNav', [
    // c = count  d = display Name  l = latest position (menu index)   s = short name   o = online
    {
      cid: '2001',
      c: 0,
      l: -1,
      f: 'Community',
      title: 'Community',
      role: 'community',
      // draw: function() { Chat.draw() },
      o: true,
    },
    {
      cid: '2002',
      c: 0,
      l: -1,
      f: 'Vivi Bot',
      title: 'Vivi Bot',
      role: 'bot',
      // draw: function() { Chat.draw() },
      o: true,
    },
    {
      cid: '1001',
      c: 0,
      l: -1,
      f: 'Sheela Anand',
      title: 'SA',
      role: 'user',
      // draw: function() { Chat.draw() },
      o: true,
    },
    {
      cid: '1002',
      c: 0,
      l: -1,
      f: 'Bertrand Arnaud',
      title: 'BJ',
      // draw: function() { Chat.draw() },
      o: true,
    },
    {
      cid: '1003',
      c: 0,
      l: -1,
      f: 'Marc Woods',
      title: 'MG',
      role: 'user',
      // draw: function() { Chat.draw() },
      o: false,
    },
    {
      cid: '1004',
      c: 0,
      l: -1,
      f: 'Missy Z',
      title: 'MZ',
      role: 'user',
      // draw: function() { Chat.draw() },
      o: true,
    }
  ]
  );

  const DOM = {};

  const placeholder = V.i18n( 'Send message or funds' );

  /* ================== private methods ================= */

  async function presenter( which ) {

    const $topsliderUl = ChatComponents.topSliderUl();
    const $listingsUl = ChatComponents.listingsUl();

    for ( const variable in DemoContent.chatData ) {
      const $accountData = ChatComponents.chatSmallCard( variable, DemoContent.chatData );
      V.setNode( $topsliderUl, $accountData );
    }

    const activeEntity = V.getState( 'activeEntity' );
    const messages = await V.getMessage();

    messages.data[0].forEach( cardData => {
      activeEntity && activeEntity.fullId == cardData.sender ? cardData.sender = 'Me' : null;
      const $card = ChatComponents.message( cardData );
      V.setNode( $listingsUl, $card );
    } );

    // const $lastCard = ChatComponents.message( { sender: 'Me', msg: 'You\'ve sent 560 V to Sheela Anand #3565' } );
    // V.setNode( $listingsUl, $lastCard );

    const pageData = {
      topcontent: V.sN( {
        t: 'h2',
        c: 'font-bold fs-l leading-snug txt-center w-screen pxy',
        h: 'Conversation with Community #2121'
      } ),
      listings: $listingsUl,
      position: 'top'
    };

    return pageData;
  }

  function view( pageData ) {
    Page.draw( pageData );
    Chat.drawMessageBox();
  }

  /* ============ public methods and exports ============ */

  function drawMessageBox( options ) {
    if ( options == 'clear' ) {
      return V.setNode( '.messagebox', 'clear' );
    }
    const $box = V.sN( {
      t: 'div',
      s: {
        messagebox: {
          'bottom': '0',
          'border-top': '1px solid #e8e8ec',
          'background': '#d1d2da',
          'padding': '8px 5px'
        }
      },
      c: 'messagebox flex fixed pxy w-full bkg-white card-shadow',
    } );
    const $input = V.sN( {
      t: 'textarea',
      // h: 'send 100 to Community #2121',
      h: 'send Expert In Nodejs #2121 100',
      // h: 'send 2 to Community Contribution #2121 for hospital funding',
      // h: 'verify 0x3107b077b7745994cd93d85092db034ca1984d46',
      a: {
        placeholder: placeholder
      },
      s: {
        messagebox__input: {
          'height': '36px',
          'padding': '8px 15px',
          'min-width': '302px',
          'border': '1px solid #e8e8ec',
          'resize': 'none',
          'border-radius': '30px'
        }
      },
      c: 'messagebox__input mr-2'
    } );

    const $send = V.sN( {
      t: 'button',
      s: {
        'circle-1': {
          width: '2.5rem',
          height: '2.5rem'
        }
      },
      c: 'circle-1 flex justify-center items-center rounded-full border-blackalpha bkg-white',
      h: V.getIcon( 'send' )
    } );

    // $input.addEventListener( 'focus', function( e ) {
    //   e.target.placeholder = placeholder;
    // } );
    $send.addEventListener( 'click', function() {
      DOM.$box = V.getNode( '.messagebox__input' );

      const message = DOM.$box.value;

      V.setMessageBot( message ).then( res => {
        console.log( 'res: ', res );
        if ( res.success ) {
          Account.drawHeaderBalance();
          DOM.$box.value = '';
          DOM.$box.setAttribute( 'placeholder', V.i18n( res.status ) );
          console.log( res.status );
        }
        else {
          DOM.$box.value = '';
          DOM.$box.setAttribute( 'placeholder', V.i18n( res.status ) );
          console.error( 'try again, because: ', res.status );
        }
      } );
    } );

    V.setNode( $box, [ $input, $send ] );
    V.setNode( 'body', $box );

  }

  function draw( which ) {
    presenter( which ).then( viewData => { view( viewData ) } );
  }

  return {
    draw: draw,
    drawMessageBox: drawMessageBox
  };

} )();
