//------------------MQTT---------------
var mqtt;
var host = "j7TPsoTxU5fLSBsnZqIZXA.mywire.org"//"broker.hivemq.com"//
var port = 9001
var benchpressCtr = [0,0]
var squatCtr = [0,0]
var deadliftCtr = [0,0]
var userIdGlobal = ""
var counterchecker = 1
var exerciseDataMQTT = null;

var takenBenchPressPrevCounter = 0;
var benchPressPrevCounter =0;
var benchPressNextCounter =0;
var benchPressCounter =0;

var takenBicepCurlPrevCounter = 0;
var bicepCurlPrevCounter =0;
var bicepCurlNextCounter=0;
var bicepCurlCounter=0;

var takenSquatPrevCounter = 0;
var squatPrevCounter =0;
var squatNextCounter=0;
var squatCounter=0;

var sessionID = Math.floor(Math.random() * 100);

var listCOunter =0;

function subscribeToUserQueryReplies(userId)
{   
    console.log("subscribing to " + userId)
    mqtt.subscribe("cs3237/response/" + userId);
}

// function subscribeToPredictioin(sessionID){
//     console.log("subscribing to " + userId)
//     mqtt.subscribe("cs3237/prediction/sessionI" + userId);
// }

function getExerciseData(){
    return exerciseData
}


function onConnect() 
{
    console.log("Connected");
    if (userIdGlobal !== ""){
        subscribeToUserQueryReplies(userIdGlobal)
    }
    subscribeToUserQueryReplies(userIdGlobal)
    mqtt.subscribe("cs3237/prediction/"+sessionID.toString())
    console.log("prediction session id is " + sessionID.toString())

    mqtt.subscribe("exerciseData")
    message = new Paho.MQTT.Message("Hello world");
    message.destinationName = "lanjiao";
    mqtt.send(message);
    console.log("sent");
    if (userIdGlobal !== ""){
        sendQueryForExerciseData()
    }
}

function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("onConnectionLost:" + responseObject.errorMessage);
    }
    }

function onMessageArrived(msg)
{
    
    if(msg.destinationName == "cs3237/response/"+userIdGlobal) {
        console.log(counterchecker + "===" +msg.payloadString)
        exerciseData = msg.payloadString
        try{
            setHistoryList(exerciseData)
        } catch(err){
            console.log(err)
        }
        try{
            setCharts(exerciseData)
        } catch(err){
            console.log(err)
        }
    }
    // if(msg.destinationName == "exerciseData"){
    if(msg.destinationName == "cs3237/prediction/" + sessionID.toString()) {
        listCounter = listCOunter +1;
    // else {
        inMessage = msg.payloadString;
        exerciseObj = JSON.parse(inMessage)
        console.log("received smth"); 

        exercise = exerciseObj["exercise"]
        count = exerciseObj["count"]

        if (exercise == "bp"){
            if(takenBenchPressPrevCounter==0) {
                benchPressPrevCounter = count;
                takenBenchPressPrevCounter=1;
            }
            benchPressNextCounter = count;
            if (benchPressNextCounter > benchPressPrevCounter) {
                benchPressCounter = benchPressCounter + 1;
                addItem("dynamic_benchpress", "Bench press", benchPressCounter)
                takenBenchPressPrevCounter =0;
            }
        }
        else if (exercise == "bc") {
            if(takenBicepCurlPrevCounter ==0) {
                bicepCurlPrevCounter = count;
                takenBicepCurlPrevCounter =1;
            }
            bicepCurlNextCounter = count;
            if(bicepCurlNextCounter > bicepCurlPrevCounter) {
                bicepCurlCounter = bicepCurlCounter +1
                addItem("dynamic_deadlift", "Deadlift", bicepCurlCounter)
                takenBicepCurlPrevCounter=0;
            }
        }
        else if (exercise == "row") {
            if(takenSquatPrevCounter ==0) {
                squatPrevCounter = count;
                takenSquatPrevCounter =1;
            }
            squatNextCounter = count;
            if(squatNextCounter > squatPrevCounter) {
                squatCounter = squatCounter +1
                addItem("dynamic_squat", "", squatCounter)
                takenSquatPrevCounter=0;
            }
        }

        



        console.log(inMessage)
        // if (exercise == "bench_press") 
        // {
        //     // benchpressCtr[1] = benchpressCtr[1] + 1
            
        //     addItem("dynamic_benchpress", "Bench press", benchPressCounter)
        // }
        // else if (exercise == "bicep_curl")
        // {
        //     // deadliftCtr[1] = deadliftCtr[1] + 1
        //     addItem("dynamic_deadlift", "Deadlift", bicepCurlCounter)
        // }
        // else if (exercise == "Squat")
        // {
        //     // squatCtr[1] = squatCtr[1] + 1
        //     addItem("dynamic_squat", "Squat", count)
        // }
        // else if (exercise == "Rest")
        // {
        //     deadliftCtr[1] = 0
        //     benchpressCtr[1] = 0
        //     squatCtr[1] = 0
        // }    //addItem("dynamic_benchpress", outMessage, 0)
    }
}

function MQTTconnect(userId)
{
    if(typeof userId !=='undefined'){
        userIdGlobal = userId
    }
    console.log("hello beech")
    console.log("connecting to "+ host + " "+ port);
    mqtt = new Paho.MQTT.Client(host, port, "clientjs")
    options = {timeout: 50, onSuccess: onConnect,userName: "bearcub", password: "xBTBOXuWBPIk7rEuHzZ0aw"};
    mqtt.onMessageArrived = onMessageArrived;
    mqtt.onConnectionLost = onConnectionLost;
    mqtt.connect(options);
    console.log("still trying")
}



//sends the sensor data over to the sever to be processed by ML model
function sendSensorData(sensorData)
{
    
    sensorData["session_id"] = sessionID.toString();
    console.log(sensorData)
    sensorDataString =JSON.stringify(sensorData)
    message = new Paho.MQTT.Message(sensorDataString);
    message.destinationName = "cs3237/predict"
    mqtt.send(message);
}


//Sends the exercise information to the database 
//exercise data should be a json string with a key = user_id
function sendExerciseDataToDB(exerciseData)
{
    message = new Paho.MQTT.Message(exerciseData);
    message.destinationName = "cs3237/store"
    mqtt.send(message)
}

function sendQueryForExerciseData()
{
    console.log("useridGlobal is "+ userIdGlobal)
    var queryJsonString = JSON.stringify({"user_id": userIdGlobal})
    console.log(queryJsonString)
    message = new Paho.MQTT.Message(queryJsonString);
    message.destinationName = "cs3237/query"
    mqtt.send(message)
    console.log("sent query")
}

function updateExerciseRep(listId, exerciseCtr)
{   
    var weight = document.getElementById("weightsField").value
    
    const ul = document.getElementById(listId)
    
    var li = ul.getElementsByTagName('li');
    var lastItem = li[li.length -1]
    var inputs = lastItem.getElementsByTagName('input')
    var weightUsed = inputs[0].value
    var reps = inputs[1].value

    inputs[1].value = exerciseCtr
}

function makeNextSet() {
    takenBenchPressPrevCounter = 0;
    benchPressPrevCounter =0;
    benchPressNextCounter =0;
    benchPressCounter =0;
    
    takenBicepCurlPrevCounter = 0;
    bicepCurlPrevCounter =0;
    bicepCurlNextCounter=0;
    bicepCurlCounter=0;
    
    takenSquatPrevCounter = 0;
    squatPrevCounter =0;
    squatNextCounter=0;
    squatCounter=0;
}


function addItem(list, itemName, exerciseCtr)
{
    if (exerciseCtr == 1)
    {
        var weight = document.getElementById("weightsField").value
        var ul = document.getElementById(list);
        
        var li = document.createElement("li");
        li.setAttribute('id',"ownListItem");
        li.setAttribute("exerciseInfo", [weight, exerciseCtr])
        //li.style = "font-size: 15px;"

        var div1 = document.createElement("span")
        div1.style = "display: inline-block;"

        var input = document.createElement("input")
        input.setAttribute('id', "ownInput")
        input.type = "text"
        input.inputMode = "decimal"
        input.value = weight
        input.size = 20
        
        div1.appendChild(input)

        var div2 = document.createElement("span")
        div2.style = "display: inline-block; margin-left: -20px;"
        div2.innerHTML = "kg  \xa0x\xa0"


        var input2 = document.createElement("input")
        input2.setAttribute('id', "ownInput")

        input2.type = "text"
        input2.inputMode = "decimal"
        input2.value = exerciseCtr
        input2.size = 20
        div2.appendChild(input2)
        
        li.appendChild(div1)
        li.appendChild(div2)
        ul.appendChild(li);
    }
    else {
        updateExerciseRep(list, exerciseCtr)
    }
}

//Updates the database on the exercise data when a button(TBC) is pressed
function updateDatabase(){
    var date = new Date().toLocaleString()
    console.log(date)
    dbData = {}
    var benchPress = {}
    var squat = {}
    var deadlift = {}

    var userId = document.getElementById("welcomeUser").value
    const benchPressList = document.getElementById("dynamic_benchpress").getElementsByTagName('li')
    const squatList = document.getElementById("dynamic_squat").getElementsByTagName('li')
    const deadliftList = document.getElementById("dynamic_deadlift").getElementsByTagName('li')

    for (var i =0; i < benchPressList.length; i ++){
        var inputs = benchPressList[i].getElementsByTagName('input');
        benchPress[i] = [inputs[0].value, inputs[1].value]       
    }
    for (var i =0; i < squatList.length; i ++){
        var inputs = squatList[i].getElementsByTagName("input");
        squat[i] = [inputs[0].value, inputs[1].value]       

    }
    for (var i =0; i < deadliftList.length; i ++){
        var inputs = deadliftList[i].getElementsByTagName("input");
        deadlift[i] = [inputs[0].value, inputs[1].value]
    }
    
    dbData["user_id"] = userId
    dbData["date"] = date
    dbData["benchPress"] = benchPress
    dbData["squat"] = squat
    dbData["deadlift"] = deadlift

    var obj = JSON.stringify(dbData)
    console.log(obj)
    return dbData

    
}


function removeItem(itemName){
    var ul = document.getElementById("dynamic-list");
    var item = document.getElementById(itemName);
    ul.removeChild(itemName);
}


function sendHttpReqForExerciseData(userId) {
    console.log(userId)
    var url = "http://j7TPsoTxU5fLSBsnZqIZXA.mywire.org:52995/retrieve?user_id=" + userId;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = 'json';
    xhr.setRequestHeader("Authorization", "fcaf6094fbbd3e541e446f6c16a62ae6");

    xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
        console.log("received")
        console.log(xhr.status);
        console.log(xhr.response)
        try{
            setHistoryList(xhr.response)
        } catch(err){
            console.log(err)
        }
        try{
            setCharts(xhr.response)
        } catch(err){
            console.log(err)
        }
    }};

    xhr.send();
    console.log("sent")
}

function sendHttpPostRequestToDb(data){

    var url = "http://j7TPsoTxU5fLSBsnZqIZXA.mywire.org:52995/upload";
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", "fcaf6094fbbd3e541e446f6c16a62ae6");

    xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
        console.log("here")
        console.log(xhr.status);
        console.log(xhr.responseText);
    }};

    dataString = JSON.stringify(data);
    xhr.send(dataString);
    console.log("sent post request");

}

function sendHttpDeleteRequestToDb(userId, index) {
    var url = "http://j7TPsoTxU5fLSBsnZqIZXA.mywire.org:52995/delete?user_id=" + userId + "&index=" +index;

    var xhr = new XMLHttpRequest();
    xhr.open("DELETE", url);

    xhr.setRequestHeader("Authorization", "fcaf6094fbbd3e541e446f6c16a62ae6");

    xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
        console.log(xhr.status);
        console.log(xhr.responseText);
    }};

    xhr.send();

}

//------------------MQTT---------------