const VMessage = ( function() { // eslint-disable-line no-unused-vars

  /**
  * Module to add messaging to the app
  *
  *
  */

  'use strict';

  const DOM = {};

  const triggers = {
    // NOTE: Adding request and transfer commands requires updating the backend language files also

    forbiddenFirstNamesEN: ['to', 'and'],
    forbiddenFirstNamesDE: ['an', 'und'],

    commandsHelp: ['help', 'hilfe', '도움'],

    commandsSearch: ['search', 'suche', 'find', 'finde', 'fx', 'f!', 'view'],

    commands: ['nukeme', 'crashapp', 'verify', 'disable', 'enable', 'makeadmin', 'revokeadmin', 'analyse', 'a!', 'payouttokennow'],
    commandsEN: ['+', '-', 'pay', 'send', 'request', 'transfer', 'sx', 's!', 'rx', 'r!', 'tx', 't!'],
    commandsDE: ['zahle', 'sende', 'empfange', 'leite', 'zahlen', 'senden', 'empfangen', 'leiten'],
    commandsKO: ['더하기', '지불하다', '전송', '요청'], // TODO: add 'transfer' and check sychronicity of 'request' and 'transfer' with backend translation file

    misspellingsEN: ['sent', 'sned', 'sedn', 'semd', 'sen ', 'snd ', 'sed '],
    misspellingsDE: [ 'TODO' ],
  };

  /* ================== private methods ================= */

  function checkForTriggers( text, triggers ) {
    const triggersConcat = triggers.commands.concat( triggers.commandsHelp, triggers.commandsSearch, triggers.commandsEN, triggers.commandsDE, triggers.commandsKO );

    const checkParts = text.trim().split( ' ' );

    // in case user misses a blank, insert it // TODO: simplify and rework this functionality, also to work for all languages
    if ( checkParts[0].charAt( 0 ) === '+' || checkParts[0].charAt( 0 ) === '-' ) { checkParts.splice( 1, 0, checkParts[0].slice( 1 ) ); checkParts.splice( 0, 1, checkParts[0].charAt( 0 ) ) }
    // if (checkParts[0].substring(0,3) === 'pay') { checkParts.splice(0,0,checkParts[0].substring(0,3)); checkParts.splice(1,1,checkParts[1].substring(3,checkParts[1].length)); }
    // if (checkParts[0].substring(0,7) === 'request') { checkParts.splice(0,0,checkParts[0].substring(0,7)); checkParts.splice(1,1,checkParts[1].substring(7,checkParts[1].length)); }
    // // BUG: this is incompatible between German ("sende") and English ("send"): if (checkParts[0].substring(0,4) === 'send' || checkParts[0].substring(0,4) === 'plus' || checkParts[0].substring(0,4) === 'sned' || checkParts[0].substring(0,4) === 'sent' ) { checkParts.splice(0,0,checkParts[0].substring(0,4)); checkParts.splice(1,1,checkParts[1].substring(4,checkParts[1].length)); }

    if ( triggersConcat.indexOf( checkParts[0].toLowerCase() ) != -1 ) {
      checkParts[0] = checkParts[0].toLowerCase();
      return checkParts;
    }
    else {
      return false;
    }
  }

  function sanitize( input ) {
    return input.trim().replace( /(?:\r\n|\r|\n)/g, ' ' ).replace( /<[^>]+>/g, '' );
  }

  /* ============ public methods and exports ============ */

  function setBot( message ) {

    const text = sanitize( message );

    if ( text.indexOf( 'vx' ) > -1 ) {
      return Promise.resolve( { status: 'error', message: 'unique phrase entered?' } );
    }

    else if ( text.match( /[a-zA-Z0-9+]/ ) === null ) {
      return Promise.resolve( { status: 'error', message: 'not a valid message' } );
    }

    else if ( triggers.misspellingsEN.concat( triggers.misspellingsDE ).indexOf( text.substr( 0, 4 ) ) >= 0 ) {
      return Promise.resolve( { status: 'error', message: 'misspelled trigger' } );
    }

    else {

      /**
       * does message include trigger words?
       */

      const caseArray = checkForTriggers( text, triggers );

      if ( !caseArray ) {

        /**
        * if message is good and no trigger word was detected just send a message
        *
        */

        return V.setMessage( text );
      }
      else {

        if ( triggers.commandsHelp.indexOf( caseArray[0] ) != -1 ) {   // does message include trigger word "help"?
          $( '.notification-container' ).remove();
          $( '#messages-ul' ).append( '<li class="notification-container highlight" onclick="$(this).slideUp( 100, function() {})">' + str10110 + '<span class="close-x"><i class="fas fa-times-circle close-x"></i></span></li>' );
          autoScroll();
        }
        else if ( triggers.commandsSearch.indexOf( caseArray[0] ) != -1 ) {   // does message include trigger word "search"?
          findAndDisplayEntity( message );
        }
        else if ( caseArray[0] === 'nukeme' ) {
          return V.setData( 'nukeme' );
        }
        else if ( caseArray[0] === 'crashapp' ) {
          return V.setData( 'crash-app' );
        }
        // TODO:
        // else if ( caseArray[0] === 'analyse' ||  caseArray[0] === 'a!' ) {
        //   socket.emit( 'analyse', [caseArray, Cookies.get( 'uPhrase' )], function( callback ) {
        //
        //     displayAnalysis( callback );
        //
        //   } );
        //
        // }
        else if ( caseArray[0] === 'verify' ) {

          // V.setData( 'new verification', caseArray[1], V.getSetting( 'transactionLedger' ) );
          V.setEntity( { fullId: caseArray[1] }, { key: 'new verification' } );
        }
        // else if ( caseArray[0] === 'makeadmin' ) {
        //   socket.emit( 'makeadmin', [caseArray, Cookies.get( 'uPhrase' )] );
        //
        // }
        // else if ( caseArray[0] === 'revokeadmin' ) {
        //   socket.emit( 'revokeadmin', [caseArray, Cookies.get( 'uPhrase' )] );
        //
        // }
        // else if ( caseArray[0] === 'disable' ) {
        //   socket.emit( 'disable', [caseArray, Cookies.get( 'uPhrase' )] );
        //
        // }
        // else if ( caseArray[0] === 'enable' ) {
        //   socket.emit( 'enable', [caseArray, Cookies.get( 'uPhrase' )] );
        //
        // }
        // else if ( caseArray[0] === 'payouttokennow' ) {
        //   socket.emit( 'payout tokens now', [caseArray, Cookies.get( 'uPhrase' )] );
        //
        // }
        else { // command can only be "send" or "request" at this point
          return V.setTransaction( caseArray );

        }
      }
    }
  }

  function getMessage( data ) {
    // TODO
  }

  function setMessage( whichMessage, options ) {

    if ( !options ) {
      options = { key: 'new message' };
    }

    const msgData = {};
    msgData.message = whichMessage;
    msgData.sender = V.getState( 'activeEntity' ).fullId;
    return V.setData( msgData, options, V.getSetting( 'chatLedger' ) );
  }

  return {
    getMessage: getMessage,
    setMessage: setMessage,
    setBot: setBot,
  };

} )();
