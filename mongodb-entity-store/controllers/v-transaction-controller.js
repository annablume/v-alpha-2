const findEntities = require( '../lib/find-entities' );
const updateEntities = require( '../lib/transaction-mongodb/update-entities' );
const checkValid = require( '../lib/transaction-mongodb/check-tx-validity' );

const addRolesSimplified = ( array ) => {

  const a = JSON.parse( JSON.stringify( array[0] ) );
  const b = JSON.parse( JSON.stringify( array[1] ) );
  const c = JSON.parse( JSON.stringify( array[2] ) );
  const d = JSON.parse( JSON.stringify( array[3] ) );

  a['roleInTx'] = 'community';
  b['roleInTx'] = 'taxpool';
  c['roleInTx'] = 'sender';
  d['roleInTx'] = 'recipient';

  return [a, b, c, d];
};

const TxDB = require( '../models/v-transaction-model' );

exports.updateEntities = function( req, res ) {

  /*
  {
    date: '2020-02-27T19:10:56.551Z',
    amount: 980,
    command: 'send',
    sender: 'The Ocean Cleanup #9262',
    recipient: 'Web Developing #9656',
    reference: 'homepage codebase',
    timeSecondsUNIX: 1582830656,
    origMessage: [
      'send',       '980',
      'to',         'Web',
      'Developing', '#9656',

      'for',        'homepage',
      'codebase'
    ]
  }
  */
  // res( { status: 'error', message: 'need to code transaction still' } );
  // return;

  const txData = req;

  findEntities.findAllEntities( txData )
    .then( entities => {

      // const txRoleEntities = addTxRole.addTxRole( messageParts, entities );
      const txRoleEntities = addRolesSimplified( entities );

      const checkValidity = checkValid.checkTxValidity( txRoleEntities, txData.amount, txData.timeSecondsUNIX, txData.reference, txData.command );

      if ( checkValidity != true ) {
        res( { status: 'error', message: 'could not validate transaction: ' + checkValidity } );
      }
      else {
        // Updating MongoDB Accounts
        updateEntities.updateAllEntities( txRoleEntities, txData.amount, txData.date, txData.timeSecondsUNIX, txData.reference, txData.command );

        // TODO: callback only after updating finished
        res( { status: 'success', message: 'Transaction successfully processed' } );
      } // close else (valid transaction)

    } )
    .catch( ( err ) => {
      console.log( 'Issue in transaction - ' + err );
      res( { status: 'error', message: 'Issue in transaction - ' + err } );
    } );

};

exports.findTransaction = function( req, res ) {
  console.log( req );
  TxDB.find( { fullId: req }, function( err, entities ) {
    if ( err ) {
      res( {
        success: false,
        status: 'error',
        message: err,
      } );
    }
    else {
      console.log( entities );
      res( {
        success: true,
        status: 'success',
        message: 'Transaction history retrieved successfully',
        data: [entities[0].txHistory]
      } );
    }
  } );
};
