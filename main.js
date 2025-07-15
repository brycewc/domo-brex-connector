'use strict';
//API documentation: https://developer.brex.com

var id = metadata.parameters['id'] || null;
var pattern = /^(dpacc_)([a-z0-9]){25,26}$/;
const baseUrl = 'https://platform.brexapis.com';
var urlParameters = [];
var base64Prefix = '';
if (pattern.test(id) || id == null) {
	//Switch to change function parameters for request based on selected report.
	switch (metadata.report) {
		case 'Vendors':
			request('/v1/vendors');
			break;
		case 'Transfers':
			request('/v1/transfers');
			break;
		case 'Cash Accounts':
			request('/v2/accounts/cash');
			break;
		case 'Users':
			base64Prefix = 'User:';
			request('/v2/users');
			break;
		case 'Card Accounts':
			request('/v2/cards');
			break;
		case 'Primary Card Account Statements':
			request('/v2/accounts/card/primary/statements');
			break;
		case 'Cash Account Statements':
			request(`/v2/accounts/cash/${id}/statements`);
			break;
		case 'Primary Card Account Transactions':
			base64Prefix = 'StatementEntry:';
			urlParameters = [
				{
					key: 'expand[]',
					value: 'expense_id',
				}
			];
			request('/v2/transactions/card/primary', urlParameters);
			break;
		case 'Cash Account Transactions':
			request(`/v2/transactions/cash/${id}`);
			break;
		case 'Locations':
			request('/v2/locations');
			break;
		case 'Departments':
			request('/v2/departments');
			break;
		case 'Cards':
			base64Prefix = 'Card:';
			request('/v2/cards');
			break;
		case 'Budgets':
		  base64Prefix: 'SpendLimit:';
			request(`/v2/budgets/${id}`);
			break;
		case 'Budget Programs':
			request('/v1/budget_programs');
			break;
		case 'Spend Limits':
		  base64Prefix = 'SpendLimit:';
			request('/v2/spend_limits');
			break;
		case 'Trips':
			request('/v1/trips');
			break;
		case 'Expenses':
		  base64Prefix = 'Expense:';
			urlParameters = [
				{
					key: 'expand[]',
					value: 'location',
				},
				{
					key: 'expand[]',
					value: 'department',
				},
				{
					key: 'expand[]',
					value: 'merchant',
				},
				{
					key: 'expand[]',
					value: 'receipts.download_uris',
				},
				{
					key: 'expand[]',
					value: 'user',
				},
				{
					key: 'expand[]',
					value: 'budget',
				},
				{
					key: 'expand[]',
					value: 'payment',
				},
			];
			request(
				'/v1/expenses/card',
				urlParameters
			);
			break;
		default:
			// Gracefully handle a report error
			DOMO.log(metadata.report + ' is not a supported report.');
			datagrid.error(0, metadata.report + ' is not a supported report.');
			break;
	}
} else {
	DOMO.log('Parameter does not match Regex.');
	datagrid.error(0, 'Parameter input was not valid.');
}

function request(endpoint, parameters = null) {
	var urlWithParams = baseUrl + endpoint + '?limit=1000';
	httprequest.addHeader('Authorization', 'Bearer ' + metadata.account.apikey);
	httprequest.addHeader('X-Brex-Trace-Id', 'Domo ' + new Date());
	if (parameters !== null) {
		parameters.forEach(
			(param) => (urlWithParams += '&' + param.key + '=' + param.value)
		);
	}
	var data;
	var nextCursor = null;
	do {
	  let cursor = nextCursor === null ? '' : `&cursor=${nextCursor}`
		let response = httprequest.get(urlWithParams + cursor);
		if (httprequest.getStatusCode() == 200) {
			response = JSON.parse(response);
			nextCursor = response.next_cursor || null;
			data = response.items || response;
			if (Object.keys(data).length !== 0) {
			  if (base64Prefix !== '') {
			    data.forEach(
					(item) =>
						(item.id_base64 = DOMO.b64EncodeUnicode(base64Prefix + item.id))
				  );
  			}
				datagrid.magicParseJSON(
					JSON.stringify(
						data.map(
							(x) => (
								data
									.map((x) => Object.keys(x))
									.reduce(
										(a, b) => (
											b.forEach((z) => a.includes(z) || a.push(z)), a
										)
									)
									.forEach((y) => (x[y] = x.hasOwnProperty(y) ? x[y] : '')),
								x
							)
						)
					)
				);
			} else {
  			// Gracefully handle an http error
  			DOMO.log('Received Http Error: ' + httprequest.getStatusCode());
  			datagrid.error(
  				httprequest.getStatusCode(),
  				'Received HTTP error: ' + httprequest.getStatusCode()
  			);
  		}
		}
	} while (nextCursor != null);
}