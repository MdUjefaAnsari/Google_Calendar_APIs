/* exported gapiLoaded */
/* exported gisLoaded */
/* exported handleAuthClick */
/* exported handleSignoutClick */

// TODO(developer): Set to client ID and API key from the Developer Console


// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

let tokenClient;
let gapiInited = false;
let gisInited = false;
let selectedDate = new Date();

document.getElementById('authorize_button').style.visibility = 'hidden';
document.getElementById('signout_button').style.visibility = 'hidden';
document.getElementById("date_input").style.visibility = "hidden";
document.getElementById("date_input_end").style.visibility = "hidden";
document.getElementById("submit_button").style.visibility = "hidden";
document.getElementById("dataTable").style.visibility = "hidden";


/**
 * Callback after api.js is loaded.
 */
function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

/**
 * Callback after the API client is loaded. Loads the
 * discovery doc to initialize the API.
 */
async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;
  maybeEnableButtons();
}

/**
 * Callback after Google Identity Services are loaded.
 */
function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // defined later
  });
  gisInited = true;
  maybeEnableButtons();
}

/**
 * Enables user interaction after all libraries are loaded.
 */
function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    document.getElementById('authorize_button').style.visibility = 'visible';
  }
}

function handleDateSelect(formattedDate) {
  selectedDate = new Date(formattedDate);
  listUpcomingEvents(startDate);
}

function handleEndDateSelect(formattedDates){
  anotherDate = new Date(formattedDates);
  listUpcomingEvents( endDate)
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick() {
  tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      throw (resp);
    }
    document.getElementById('signout_button').style.visibility = 'hidden';
    document.getElementById('authorize_button').style.visibility = 'hidden';
    document.getElementById("date_input").style.visibility = "visible";
    document.getElementById("date_input_end").style.visibility = "visible";
    document.getElementById("submit_button").style.visibility = "visible";

  };

  if (gapi.client.getToken() === null) {
    // Prompt the user to select a Google Account and ask for consent to share their data
    // when establishing a new session.
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    // Skip display of account chooser and consent dialog for an existing session.
    tokenClient.requestAccessToken({ prompt: '' });
  }
}

async function handleDateSubmit() {
  document.getElementById('signout_button').style.visibility = 'visible';
  document.getElementById('authorize_button').style.visibility = 'visible';
  document.getElementById('authorize_button').innerText = 'Refresh';
  document.getElementById("date_input").style.visibility = "hidden";
  document.getElementById("date_input_end").style.visibility = "hidden";
  document.getElementById("submit_button").style.visibility = "hidden";
  document.getElementById("dataTable").style.visibility = "visible";
  await listUpcomingEvents(selectedDate, anotherDate);
};
/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick() {
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken('');
    document.getElementById('content').innerText = '';
    document.getElementById('authorize_button').innerText = 'Authorize';
    document.getElementById('signout_button').style.visibility = 'hidden';
  }
}
//using chart js display no of meeting and the time spending meetings in the form of  two charts.

/**
 * Print the summary and start datetime/date of the next ten events in
 * the authorized user's calendar. If no events are found an
 * appropriate message is printed.
 */
async function listUpcomingEvents(startDate, endDate) {
  let response;
  // Get the next day by adding number of milliseconds in a day
  // (24 hours * 60 minutes * 60 seconds * 1000 ms)
  //  endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
  //   startDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
  console.log(startDate, endDate);
  try {
    const request = {
      'calendarId': 'primary',
      'timeMin': startDate.toISOString(),
      'timeMax': endDate.toISOString(),
      'showDeleted': false,
      'singleEvents': true,
      'orderBy': 'startTime',
    };
    response = await gapi.client.calendar.events.list(request);
  } catch (err) {
    document.getElementById('content').innerText = err.message;
    return;
  }
  console.log(response);

  const events = response.result.items;
  if (!events || events.length == 0) {
    document.getElementById('content').innerText = 'No events found.';
    return;
  }
  displayEventsInTable(events, startDate, endDate);
  // Flatten to string to display
  const output = events.reduce(
    (str, event) => `${str}${event.summary} (${event.start.dateTime || event.start.date})\n`,
    'Events:\n');
  document.getElementById('content').innerText = output;
}

// This function takes an array of events as a parameter and displays them in an HTML table.
function displayEventsInTable(events) {
const tableBody = document.getElementById('tableBody');
let totalMeetings = 0;
let totalMinutes = 0;

// Use map to transform each event into a row element.
const rows = events.map(event => {
const { start, end } = event;
const duration = (new Date(end.dateTime) - new Date(start.dateTime)) / (1000 * 60);
console.log(duration)
totalMeetings++;
totalMinutes += duration;

// Return a new row element for each event.
const row = document.createElement('tr');
row.insertCell().textContent = new Date(start.dateTime).toLocaleDateString();
row.insertCell().textContent = '1';
row.insertCell().textContent = duration + ' Mins';

return row;
});

// Append all the rows to the table body.
rows.forEach(row => {
tableBody.appendChild(row);
});

// Add a summary row at the end.
const countRow = tableBody.insertRow();
countRow.insertCell().textContent = 'Total:';
countRow.insertCell().textContent = totalMeetings.toString();
countRow.insertCell().textContent = totalMinutes + ' Mins';
}
