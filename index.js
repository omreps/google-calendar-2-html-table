let http = require('http');
let {google} = require('googleapis');

let eventsList;
let jwtClient = null;

let urlDate = "";

const COLOR_WHITE = '#FE887C';
const COLOR_SILVER = '#A4BDFD';
const COLOR_GOLD = '#FC753B';
const COLOR_LOFT = '#6782CF';
const COLOR_FREE = '#F5F5F5';

const BOOKED_WHITE_TXT = 'Белый зал, забронирован';
const BOOKED_SILVER_TXT = 'Серебряный, забронирован';
const BOOKED_GOLD_TXT = 'Золотой зал, забронирован';
const BOOKED_LOFT_TXT = 'Зал Лофт, забронирован';

const columnTD_om_time = '<td style="text-align: center;height: 50px;">';
const columnTD_om = '<td><div style="display: -webkit-flex;display: flex;align-items: center;justify-content: center;width:100%; height:100%; border: 1px solid lightgrey;background-clip: padding-box; border-radius: 5px;text-align: center;background-color:' + COLOR_FREE + ';">' + 'Свободен';
const columnTD_cm = '</td>';
const column_30_free_top = '<div style="display: -webkit-flex;display: flex;align-items: center;justify-content: center;border: 1px solid lightgrey;border-radius: 5px;background-color: ' + COLOR_FREE + ';height: 22px;width: 100%;">Свободен</div>';
const column_30_free_bottom = '<div style="margin:-1px 0 0 0px; display: -webkit-flex;display: flex;align-items: center;justify-content: center;border: 1px solid lightgrey;border-radius: 5px;background-color: ' + COLOR_FREE + ';height: 22px;width: 100%;">Свободен</div>';
const GMTOffset = 3; //local GMT
const TIMEOUT = 5000;

let fEventListUpdated = false;

http.createServer(function (request, response) {
    
    fEventListUpdated = false;
  
    urlDate = (request.url).split('?')[1];
    console.log(urlDate);
    
    response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8;'});

    eventsList = "";
  
    retriveGCalEvents();

    let waitingTime = 0;
    let waitingId = setInterval(() => {
      if ((waitingTime < TIMEOUT)&&(eventsList === "")) {
         waitingTime = waitingTime + 100;
      } else {
         clearInterval(waitingId);
         console.log(eventsList);
        
         response.write('<html><head>');
         response.write('<link href="data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQEAYAAABPYyMiAAAABmJLR0T///////8JWPfcAAAACXBIWXMAAABIAAAASABGyWs+AAAAF0lEQVRIx2NgGAWjYBSMglEwCkbBSAcACBAAAeaR9cIAAAAASUVORK5CYII=" rel="icon" type="image/x-icon" />');//no favicon at all
         response.write('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"/>');
         response.write('<link rel="stylesheet" type="text/css" media="all" href="https://cdn.glitch.com/8c8abf83-748c-401b-8fba-0d082394b640%2Fdaterangepicker.css?1542550681396" />');
         response.write('<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.js"></script><script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.22.1/moment.min.js"></script><script type="text/javascript" src="https://cdn.glitch.com/8c8abf83-748c-401b-8fba-0d082394b640%2Fdaterangepicker.js?1542552213798"></script>');      
        
         response.write("<script>$(function() {");
         response.write("let dateParam = location.search.split('?')[1];console.log('param:'); console.log(dateParam);");
         response.write("if((dateParam === undefined)||(dateParam === '')) $('input[name=\"gcal\"]').val((moment().add(1, 'day')).format('MM/DD/YYYY'));");
         response.write("else $('input[name=\"gcal\"]').val(moment(dateParam).format('MM/DD/YYYY'));");
         
         response.write("$('input[name=\"gcal\"]').daterangepicker({singleDatePicker: true, showDropdowns: true, opens: 'center',minYear: parseInt(moment().format('YYYY'), 10)-1, maxYear: 2100, locale: {firstDay: 1}},");
         response.write('function(start, end, label) {');
         response.write('window.location.href = window.location.href.replace( /[\?#].*|$/, "?" + start.format(\'MM/DD/YYYY\') );});');
         response.write('$("input[name=\'gcal\']").trigger("click");setTimeout(function(){ $("input[name=\'gcal\']").trigger("click"); }, 50);');
         response.write('$("#overlayTbl").css("margin-top", -1*$("#mainTbl").height());});');
         response.write('</script>');
        
         response.write('<style>');
         response.write('input[type=\'text\'] {font-size: 24px; font-family: monospace; sans-serif;text-align: center; width: 265px; margin-left: 15px; padding-right: 30px;}');
         response.write('.dayTable{font-family: arial, sans-serif;table-layout: fixed;width:900px;margin: auto; left: 0;right: 0;margin: auto;}');
         response.write('th{height: 20px;}'); 
         response.write('td{height: 50px;}');
         response.write('tr:hover td{background-color: lightblue; opacity:0.3;}');
         response.write('@media (max-width: 922px) {.contCalendar{width:100%;}}');
         response.write('@media (max-width: 1222px) {.dayTable{width:600px;}}');
         response.write('</style>');
         response.write('</head><body>');

         response.write('<div style="font-family: arial, sans-serif; text-align: center; height: 50px;padding-top:30px;padding-bottom:70px;"><h2><i class="fa fa-calendar" style="font-size:34px;"></i>&nbsp&nbspЗалы в Pastila</h2></div>');
         response.write('<div style="display: flex;flex-wrap: wrap;">');
        
         response.write('<div class="contCalendar"><div style="margin: 0 auto; padding-top: 26px; width:300px; height: 300px;"><input style="font-family: arial, sans-serif; text-align: center; " type="text" id="gcal" name="gcal" value="" /></div></div>');
         
         response.write('<div class="contCalendar"><div style="margin: 0 auto; ">');
         response.write('<table class="dayTable"  id="mainTbl"><tr><th></th><th>Белый</th><th>Серебр.</th><th>Золотой</th><th>Лофт</th></tr>');
         response.write(eventsList);
         response.write('</table>');
        
         response.write('<table class="dayTable" id="overlayTbl">');//empty overlay table for row hovers, mixed with the cell colors 
         response.write('<tr><th></th><th></th><th></th><th></th><th></th></tr>');response.write('<tr><td></td><td></td><td></td><td></td><td></td></tr>');
         response.write('<tr><td></td><td></td><td></td><td></td><td></td></tr>');response.write('<tr><td></td><td></td><td></td><td></td><td></td></tr>');
         response.write('<tr><td></td><td></td><td></td><td></td><td></td></tr>');response.write('<tr><td></td><td></td><td></td><td></td><td></td></tr>');
         response.write('<tr><td></td><td></td><td></td><td></td><td></td></tr>');response.write('<tr><td></td><td></td><td></td><td></td><td></td></tr>');
         response.write('<tr><td></td><td></td><td></td><td></td><td></td></tr>');response.write('<tr><td></td><td></td><td></td><td></td><td></td></tr>');
         response.write('<tr><td></td><td></td><td></td><td></td><td></td></tr>');response.write('<tr><td></td><td></td><td></td><td></td><td></td></tr>');
         response.write('<tr><td></td><td></td><td></td><td></td><td></td></tr>');
         response.write('</table><div><div>');
        
         response.end('</body></html>');
      }
    }, 100);
    
}).listen(8080);

console.log('Server running at http://(localhost|glitch):80');

function retriveGCalEvents()
{
  jwtClient = new google.auth.JWT(
           "your-google-service-account@gserviceaccount.com",
           null,
           "-----BEGIN PRIVATE KEY-----\n***insert yours****\n-----END PRIVATE KEY-----\n",
           ['https://www.googleapis.com/auth/calendar.readonly']);

  jwtClient.authorize ((err, tokens) => {
        if (err) {
          eventsList = 'GCalendar Authorithation error!';
          console.log(err);
          return;
        }
        else {
          console.log("Successfully connected!");
          updateEventsList();
       }
  });
}


function updateEventsList () { 
  
  if(fEventListUpdated) return;
  
  let calendar = google.calendar('v3');
  
  let firstDay = new Date(urlDate);
  firstDay.setHours(6,0,0,0);
  let secondDay = new Date(firstDay);
  secondDay.setDate(firstDay.getDate()+1);
  secondDay.setHours(6,0,0,0);
  

  if(urlDate == undefined)
  {
    let today = new Date();
    let tomorrow = new Date();
    let dayPastTomorrow = new Date();
    tomorrow.setDate(today.getDate()+1);
    dayPastTomorrow.setDate(tomorrow.getDate()+1);
    firstDay = tomorrow;
    secondDay = dayPastTomorrow;
  }
  
  firstDay.setHours(6,0,0,0);
  secondDay.setHours(6,0,0,0);
  
  console.log(firstDay);console.log(secondDay);
  
  
  calendar.events.list({
        auth: jwtClient,
        calendarId: 'you-calendar_ID',
        timeMin: firstDay.toISOString(),
        timeMax: secondDay.toISOString(),
        showDeleted: false,
        maxResults: 100,
        singleEvents: true,
        orderBy: "startTime"
      }, 
      (err, response) => {
          if (err) {
             eventsList = 'The GCalendar API returned an error!';
             console.log('The API returned an error: ' + err);
             return;
          }
    
          let events = response.data.items;
          if (events.length == 0) 
            console.log('No events found.');

          for (let hour = 9; hour <= 20; hour++)
          {
            eventsList =  eventsList + '<tr>';
            eventsList =  eventsList + columnTD_om_time;
            eventsList =  eventsList + hour.toString().padStart(2, "0") + ':00';
            eventsList =  eventsList + columnTD_cm;
            eventsList =  eventsList + columnTD_om;
            for (let event of response.data.items) {     
               if(AddColumnToEventList('елы', 'hit', event, hour, COLOR_WHITE, BOOKED_WHITE_TXT) == true) //Белый
                 break;
            }
            eventsList =  eventsList + columnTD_cm;
            eventsList =  eventsList + columnTD_om;
            for (let event of response.data.items) {     
               if(AddColumnToEventList('еребрян', 'ilve', event, hour, COLOR_SILVER, BOOKED_SILVER_TXT) == true) //Серебряный
                 break;
            }
            eventsList =  eventsList + columnTD_cm;
            eventsList =  eventsList + columnTD_om;
            for (let event of response.data.items) {     
               if(AddColumnToEventList('олото', 'old', event, hour, COLOR_GOLD, BOOKED_GOLD_TXT) == true) //Золотой
                 break;
            }
            eventsList =  eventsList + columnTD_cm;
            eventsList =  eventsList + columnTD_om;
            for (let event of response.data.items) {     
               if(AddColumnToEventList('офт', 'oft', event, hour, COLOR_LOFT, BOOKED_LOFT_TXT) == true) //Лофт
                 break;
            }
            eventsList =  eventsList + columnTD_cm;
            eventsList =  eventsList + '</tr>';
          } 
    
          fEventListUpdated = true;
      }
  );
}

function AddColumnToEventList(columnNameRus, columnNameEng, event, hour, color, bookedTxt)
{
  let dS = new Date(event.start.dateTime);let hStart = dS.getHours() + GMTOffset; let mStart = dS.getMinutes();
  let dE = new Date(event.end.dateTime); let hEnd = dE.getHours() + GMTOffset; let mEnd = dE.getMinutes();

  if((hour >= hStart)&&((hour < hEnd)||(((hour == hEnd)&&(mEnd > 0)))))
  {
    //console.log(event.summary);
    //console.log(event.location);
    if(event.location == undefined)
      return false;
    if((event.location.toUpperCase().includes(columnNameRus.toUpperCase()))||(event.location.toUpperCase().includes(columnNameEng.toUpperCase())))
    {
      if((hour == hEnd)&&(mEnd == 30)) // 30 min
      {
        eventsList =  eventsList.slice(0, -columnTD_om.length) + '<td><div style="display: -webkit-flex;display: flex;align-items: center;justify-content: center; border: 1px solid lightgrey; border-radius: 5px;background-color: ' + color + ';height: 22px;width: 100%;">Забронирован</div>' + column_30_free_bottom;
        return false;
      }
      else if((hour == hStart)&&(mStart == 30)) // 30 min
      {
        if(eventsList.endsWith(column_30_free_bottom))
          eventsList =  eventsList.slice(0, eventsList.lastIndexOf("<td>")) + '<td><div style="display: -webkit-flex;display: flex;align-items: center;justify-content: center;width:100%; height:100%; border: 1px solid lightgrey;background-clip: padding-box; border-radius: 5px;text-align: center;background-color:' + color + ';">' + bookedTxt + '</div>';  
        else
          eventsList =  eventsList.slice(0, -columnTD_om.length) + '<td>' + column_30_free_top + '<div style="margin:-1px 0 0 0px;display: -webkit-flex;display: flex;align-items: center;justify-content: center;border: 1px solid lightgrey; border-radius: 5px;background-color: ' + color + ';height: 23px;width: 100%;">Забронирован</div>';
      }
      else
        eventsList =  eventsList.slice(0, -columnTD_om.length) + '<td><div style="display: -webkit-flex;display: flex;align-items: center;justify-content: center;width:100%; height:100%; border: 1px solid lightgrey;background-clip: padding-box; border-radius: 5px;text-align: center;background-color:' + color + ';">' + bookedTxt + '</div>';
    
      return true;
    }
  }
  
  return false;
}