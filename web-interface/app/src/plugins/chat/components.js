const ChatComponents = ( function() { // eslint-disable-line no-unused-vars

  /**
   * Components for V Chat Plugin
   *
   */

  'use strict';

  function topcontent() {
    return V.cN( {
      t: 'div',
      c: 'w-full',
      h: [
        V.cN( {
          t: 'h2',
          c: 'font-bold fs-l leading-snug txt-center w-screen pxy',
          h: V.i18n( 'Chat with Everyone', 'app', 'chat title' )
        } ),
        V.cN( {
          t: 'span',
          c: 'block h-4 fs-s txt-center',
          i: 'typing_on_1'
        } ),
        V.cN( {
          t: 'span',
          c: 'block h-4 fs-s txt-center',
          i: 'typing_on_2'
        } ),
      ]
    } );
  }

  function message( msg ) {
    let width = msg.msg.length > 70 ? '300px' : msg.msg.length < 30 ? '220px' : '245px';
    const background = msg.sender == 'Me' ? msg.msg.match( 'You\'ve sent' ) ? '#c0d6b9' : '#e0e7eb' : '#f7f7f8';
    const linkedMsg = V.castLinks( msg.msg );
    linkedMsg.includes( 'iframe' ) ? width = '330px' : null;
    const style = msg.sender == 'Me' ? { 'margin-left': 'auto', 'width': width } : { 'margin-right': 'auto', 'width': width };

    return V.castNode( {
      tag: 'li',
      classes: 'w-screen pxy',
      y: style,
      html: '<message style="background:' + background + '" class="message__container flex card-shadow rounded bkg-white pxy">' +
                  '<div class="font-medium pxy">' +
                    ( msg.sender == 'Me' ? '' : '<p onclick="Profile.draw(\'' + V.castPathOrId( msg.sender ) + '\')" >' + msg.sender + '</p>' ) +
                    '<p>' + linkedMsg + '</p>' +
                  '</div>' +
              '</message>'
    } );
  }

  function messageForm() {
    return V.sN( {
      t: 'div',
      s: {
        messageform: {
          'bottom': '0',
          'border-top': '1px solid #e8e8ec',
          'background': '#d1d2da',
          'padding': '8px 5px'
        }
      },
      c: 'messageform flex fixed pxy w-full card-shadow',
    } );
  }

  function messageInput() {
    const aE = V.getState( 'activeEntity' );
    return V.sN( {
      t: 'textarea',
      // h: 'send 100 to Community #2121',
      // h: 'send Peter Smith #2121 100',
      h: 'send Superpool #3181 100',
      // h: 'send Community Contribution #2121 100 for corona masks funding',
      // h: 'verify 0x3107b077b7745994cd93d85092db034ca1984d46',
      a: {
        placeholder: aE ? V.i18n( 'Send message or funds', 'placeholder', 'message input' ) : V.i18n( 'Join first', 'placeholder', 'message input' )
      },
      s: {
        messageform__input: {
          'height': '36px',
          'padding': '9px 15px',
          'min-width': '302px',
          'border': '1px solid #e8e8ec',
          'resize': 'none',
          'border-radius': '30px'
        }
      },
      c: 'messageform__input mr-2'
    } );
  }

  function messageSend() {
    return V.sN( {
      t: 'button',
      c: 'circle-1 flex justify-center items-center rounded-full border-shadow bkg-white',
      h: V.getIcon( 'send' )
    } );
  }

  function messageResponse() {
    return V.sN( {
      t: 'div',
      c: 'messageform__response',
      s: {
        messageform__response: {
          position: 'absolute',
          top: '-24px',
          // color: 'red',
          // background: 'white',
          // padding: '2px 8px'
        }
      },
      // h: 'test response msg'
    } );
  }

  return {
    topcontent: topcontent,
    message: message,
    messageForm: messageForm,
    messageInput: messageInput,
    messageSend: messageSend,
    messageResponse: messageResponse
  };

} )();
