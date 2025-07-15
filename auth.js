// Adding the api key in the query parameter
httprequest.addHeader('Authorization', 'Bearer ' + metadata.account.apikey);
//DOMO.log(metadata.account.apikey);

// Making the call to the api endpoint
var res = httprequest.get('https://platform.brexapis.com/v2/company');
//DOMO.log('res: ' + res);

// Make sure to determine and set the authentication status to either success or failure.
if (httprequest.getStatusCode() == 200) {
  auth.authenticationSuccess();
} else {
  auth.authenticationFailed('The request return a response of ' + httprequest.getStatusCode() + '. Please try again.');
}