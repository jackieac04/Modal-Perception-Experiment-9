//------Set up canvas begin---------
const canvas_L = document.getElementById('canvas_L');
const ctx_L = canvas_L.getContext('2d'); //determines the canvas to be 2D. 
const halfCanvasWidth = canvas_L.width / 2; //half a canvas 
const halfCanvasHeight = canvas_L.height / 2;
canvas_L.height = canvas_L.height - 50;

//--------------------------------------
//---------SET PARAMETERS BEGIN---------
//--------------------------------------
const secretCode = "CGFBB5IK"; //dont use I/L O/0 because they are hard to understand
let responseAcceptable = false;
let freshRate = 1000/60; // The delay the animation needs before beginning after the function is called

let startTrialTime; //The Date and time the trial starts
let endTrialTime; //the Date and time the trial ends

/* Retrives the browser the experiment is being displayed on */
function getBrowser() {
    const browsers = [
        { name: "Opera", keyword: "OPR" },
        { name: "Chrome", keyword: "Chrome" },
        { name: "Safari", keyword: "Safari" },
        { name: "Firefox", keyword: "Firefox" },
        { name: "IE", keyword: "MSIE" },
    ];

    for (const browser of browsers) {
        if (navigator.userAgent.indexOf(browser.keyword || browser.name) !== -1 ) {
            return browser.name;
        } else if (!!document.documentMode) {
            return "IE";
        }
    }
    return "Unknown";
 }

// ======================== GET AMAZON MTURK WORKER ID ======================= //
    // Get inferred subject ID from URL (credit to Eyal Peer)
    function getSubjectID() {
      let parampairs = window.location.search.substring(1).split('&');
      let foundId;
      for (i in parampairs) {
        let pair = parampairs[i].split("=");
        if (pair[0] === "PROLIFIC_PID") {
          foundId = pair[1];
        }
      }
      if (foundId){
        return foundId;
      } else {
        return "testSubject";
      }
    }
// ======================== CONVERT JSON TO CSV ======================= //
// https://codingbeautydev.com/blog/javascript-convert-json-to-csv/ //
function jsonToCsv(items) { // submit button may not be working if window.frame is null - please check
    const header = Object.keys(items[0]);
    const headerString = header.join(',');
  
    // handle null or undefined values here
    const replacer = (key, value) => value ?? '';
  
    const rowItems = items.map((row) =>
      header
        .map((fieldName) => JSON.stringify(row[fieldName], replacer))
        .join(',')
    );
  
    // join header and body, and break into separate lines
    const csv = [headerString, ...rowItems].join('\r\n');
  
    return csv;
  }
function redirect() {
    // TODO: redirect elsewhere?
        window.location = "https://jhu.sona-systems.com/webstudy_credit.aspx?experiment_id=754&credit_token=2d6ab745370a4d0ba5567cdfdef69ee9&survey_code="+window.subjectID
}

// ======================== POST DATA TO SERVER ======================= //
function postData() {
    // Collect responses into JSON / csv file
    //   let dataString = JSON.stringify(window.frame);
      const csv = jsonToCsv(window.frame);

      // post response to server
      $.post("http://pclpsrescit2.services.brown.edu/blt_lab/mp-7/data/studysave.php", {
        fname: `${window.subjectID}.csv`,
        postresult_string: csv,  
      }).done(function(){
        $("#instructions").text(`Thank you! Your secret code is: ${secretCode}
        Please copy and paste this into your submission box! You may then close this window.`);
        $("#submitButton").hide();
      });
      $("#instructions").show();  
      $("#instructions").text("Thank you! Please wait while your secret code is being generated. This may take up to 5 minutes...");  
  }

let shape_A_preview_tmp;
let shape_A_test_tmp;
let vertical_tmp_A;
let vertical_tmp_array = [-50,+50]; // positions the balls at the bottom of the screen 
/* generates nrepetitions of different types of trials and pushes them to trialsList */
function trialGenerator(nRepetitions,trialsList) {
    //OSPB TRIALS (2 occluders from the start, location of moving disk is known to participant)
    for (let i = 0; i < nRepetitions; i++) { //top,congruent,match,OSPB
        setShape(1,5,0)
        setTMP()
        pushTrialInfo(trialsList, "OSPB", "top", "congruent", "match")      
    }
    for (let i = 0; i < nRepetitions; i++) { //top,congruent,new,OSPB
        setShape(2,5,1) //selects 3 shapes from 5 randomly, then replaces one of the original shapes with a new one
        setTMP()
        pushTrialInfo(trialsList, "OSPB", "top", "congruent", "new")
    }

    for (let i = 0; i < nRepetitions; i++) { //top,incongruent,match,OSPB
        setShape(1,5,0) 
        setTMP()
        pushTrialInfo(trialsList, "OSPB", "top", "incongruent", "match")
    }
    for (let i = 0; i < nRepetitions; i++) { //top,incongruent,new,OSPB
        setShape(2,5,1)
        setTMP()
        pushTrialInfo(trialsList, "OSPB", "top", "incongruent", "new") 
    } 
    for (let i = 0; i < nRepetitions; i++) { //bottom,congruent,match,OSPB
        setShape(1,5,0)
        setTMP()
        pushTrialInfo(trialsList, "OSPB", "bottom", "congruent", "match")      
    }
    for (let i = 0; i < nRepetitions; i++) { //bottom,congruent,new,OSPB
        setShape(2,5,1) //selects 3 shapes from 5 randomly, then replaces one of the original shapes with a new one
        setTMP()
        pushTrialInfo(trialsList, "OSPB", "bottom", "congruent", "new")
    }
    for (let i = 0; i < nRepetitions; i++) { //bottom,incongruent,new,OSPB
        setShape(1,5,0) 
        setTMP()
        pushTrialInfo(trialsList, "OSPB", "bottom", "incongruent", "match")
    }
    for (let i = 0; i < nRepetitions; i++) { //bottom,incongruent,match,OSPB
        setShape(2,5,1)
        setTMP()
        pushTrialInfo(trialsList, "OSPB", "bottom", "incongruent", "new") 
    }

    //MODAL TRIALS (wonky movement- the location of the disks is unknown at the beginning, then the occluder splits in two)

    trialsList = shuffle(trialsList);
    return trialsList;
}

/* generates random numbers to create arrays. */
function generateRandomNumbers(count, limit) {
    let arr = [];
    while(arr.length < count) {
        let r = Math.floor(Math.random() * limit);
        if(arr.indexOf(r) === -1) arr.push(r); //javaScript checks by index so you can't use !(r in arr)
    }
    return arr;
}
/* sets shapes on the disks.*/
function setShape(count, limit, arrNumATest) {
    shapes = generateRandomNumbers(count, limit);
    shape_A_preview_tmp = shapes[0];
    shape_A_test_tmp = shapes[arrNumATest];
}
/* sets the positions of disks at the bottom of the screen */
function setTMP() { 
        vertical = generateRandomNumbers(2, 2) 
        vertical_tmp_A = vertical_tmp_array[vertical[0]];
    }
/* pushes info about each trial to the database. */
function pushTrialInfo(trialsList, trialType, diskLocation, spatioType, matchType) {
    trialsList.push({ //pushes info about each trial to the database
        "spatiotemporalType":spatioType,
        "trialType": trialType,
        "diskLocation": diskLocation,
        "matchType": matchType,
        "shape_A_pre_ind":shape_A_preview_tmp,
        "shape_A_test_ind":shape_A_test_tmp,
        "ball_A_vertical":vertical_tmp_A,
        "responseC": "null",
        "browser": getBrowser(),
        "subjectID": getSubjectID(),
        "startTime": "null",
        "endTime": "null",
        "reactTime":"null",
    }); 
}
/*
There are 153 total trials due to the three for loops each being run until the limit
of nRepetitions (51). This is to ensure there are the same number of each different
type of trial (match, swap, new). 
*/
let trialsInfo = []; //holds the information for the trials
const nRepetitions = 51; //number of each type (3) of trial = 51 * 3 = 153 trials
trialsInfo = trialGenerator(nRepetitions,trialsInfo); //generates the trials

let trialsInfo_training = []; //holds info for training trials
const nRepetitions_training = 1; //number of each type (3) of trial = 51* 3 = 3 trials
trialsInfo_training = trialGenerator(nRepetitions_training,trialsInfo_training);
const subjectID = getSubjectID();

//---------------------------------------
//-----------FUNCTIONS BEGIN-------------
//---------------------------------------
/* Fisher-Yates shuffle- used to shuffle trials so they appear random. */
function shuffle(o){
    for(let j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
}

/* Disk properties are defined by Ball class and properties. */
class Ball {
    constructor(x, y, color, size) {
        this.x = x; //width
        this.y = y; //height
        this.color = color;
        this.size = size;
    }
    /* draws disks on the canvas. */
    draw_balls() {
        ctx_L.beginPath();
        ctx_L.strokeStyle = this.color;
        ctx_L.lineWidth = 5;
        ctx_L.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
        ctx_L.stroke();
    }
    /* updates position of a disk depending on which type of trial it is and where it is moving to. */
    updatePosition() {
        if (this.x < halfCanvasWidth) {
            this.x = this.x + velX;
            if (this.x <= halfCanvasWidth - edgeX) { //causes vertical movement
                this.y = this.y - velY;
            }
        } else {
            this.x = halfCanvasWidth;
        }
    }
};

/* Occluder properties defined by the occluder class */
class Occluder {
    constructor(height, y) {
        this.width = 100; //width -> always the same
        this.height = height;//height
        this.x = halfCanvasWidth - 50;//x coord of upper left corner -> always the same
        this. y = y; //y coord of upper left corner 
        this.color = "black";
    }

    draw_occluder() {
        ctx_L.beginPath();
        ctx_L.fillStyle = this.color;
        ctx_L.fillRect(this.x, this.y, this.width, this.height);
    }

    /* moves top occluder up offscreen and bottom occluder down offscreen*/
    updatePosition() {
        if (this.y < halfCanvasHeight) {
            this.y = this.y - velY;
        } else {
            this.y = this.y + velY;
        }
    }
};

const nDots = 1; 
const dotRadius = 40; //Radius of each dot in pixels
let AWidth = halfCanvasWidth - 230;
let AHeight =  halfCanvasHeight - 125;


let velX = 4.5;
let velY = 1.5;
let edgeX = 100;
//experiment procedures
function showInstructions() {
    $('#consent').hide();
    $('#Instruction1').show();
    $('#continueInstructionButton1').show();
}
function continueInstruction1() {
    $('#Instruction1').hide();
    $('#continueInstructionButton1').hide();
    $('#Instruction2').show(); 
    $('#startTrainingButton').show();
}
/* 
Displays instructions based on the section of training or testing. 
*/
function instructions(instFirst, instSecond, button, type) {
    responseAcceptable = false
    if (type === 'd') {
        curTrial++;
    }
    $(instFirst).hide();
    $(instSecond).hide();

    switch (type) {
        case 'a' || 'c':
            $(button).hide();
        case 'a':
            $('#InstructionPractice').show();
        case 'b':
            trainingTrial++;
    }
}

let ballA;
/* helper used to define properties of a disk. */
function generateNewBallsHelper(x, y) {
    let ballA = new Ball(
        x,
        y,
        "white",
        dotRadius,
    );
    return ballA;
}

let occluderA;
let occluderB;
let occluderC;
/* Helper used to create new occluders.*/
function generateNewOccluder(height, y) {
    let occluder = new Occluder(
        height,
        y
    )
    return occluder;
}
/* 
Styles the screen based on if the experiment is in the training session or the
 test section.
*/
function style(type, trial, trialVal) {
    if (type !== 'a') {
        ctx_L.fillStyle = 'gray';
        ctx_L.clearRect(0,0,canvas_L.width, canvas_L.height)
    } 
    if (type !== 'a' || 'b') {
        startTrialTime = new Date();
        trialsInfo[curTrial].startTime = startTrialTime;
    }
    
    if (type === 'b') {
            $('#Instruction2').hide();
    }
    $('#canvas_L').show();
    if (trial[trialVal].trialType === "OSPB") {
        //draw 2 occluders
        occluderA = generateNewOccluder(100, halfCanvasHeight-225)
        occluderB = generateNewOccluder(100, halfCanvasHeight-100)
        occluderA.draw_occluder()
        occluderB.draw_occluder()
    } else {
        occluderC = generateNewOccluder(200, halfCanvasHeight-225)
        occluderC.draw_occluder()
    }
    ballA.draw_balls();
   
    stimuliPreview(); 
}

let trainingTrial = 0;
let curTrial = 0;
/* shows a portion of either the training or test trials and instructions depending on which part of the experiment is being run. */
function showTrials(type) {
    switch (type) {
        case 'a':
            instructions('#title', '#Instruction2', '#startTrainingButton', 'a')
            ballA = generateNewBallsHelper(AWidth, AHeight);
            style('a', trialsInfo_training, trainingTrial)
            break;

        case 'b':
            instructions('#Instruction4', '#nextTrainingTrialButton', null, 'b')
    
            if (trainingTrial < trialsInfo_training.length) {
                ballA = generateNewBallsHelper(AWidth, AHeight);
                style('b', trialsInfo_training, trainingTrial)
            } else {
                $('#InstructionPractice').hide();
                $('#Instruction3').show();
                $('#startExpButton').show();
            }
            break;

        case 'c':
            instructions('#title', '#Instruction3', '#startExpButton', 'c')
            ballA = generateNewBallsHelper(AWidth, AHeight);
            style('c', trialsInfo, curTrial)
            break;

        case 'd':
            instructions('#Instruction4', '#nextTrialButton', null, 'd')

            if (curTrial < trialsInfo.length) {
                ballA = generateNewBallsHelper(AWidth, AHeight);
                style('d', trialsInfo, curTrial)
            } else {
                $('#Instruction5').show();
                $('#submitButton').show();
            }
            break;
        }
}

let myTimeout10;
let myTimeout11;
let myTimeout12;
let shapeInd_A_pre;
let shapeInd_A_test;
let shapeInd_B_pre;
let shapeInd_B_test;
const colorDisk = 500; 
const previewShape = 1200; //length the shapes appear for each trial in milliseconds

function stimuliPreview() { // the phases before the disks and shapes move
    myTimeout10 = setTimeout(function() {
        if (trainingTrial <= trialsInfo_training.length-1) {
            shapeInd_A_pre = trialsInfo_training[trainingTrial].shape_A_pre_ind; 
        }
        if (trainingTrial === trialsInfo_training.length && curTrial>=0) {
            shapeInd_A_pre = trialsInfo[curTrial].shape_A_pre_ind;
        }
            shapeTmp = animationHelper(shapeInd_A_pre)
            ctx_L.drawImage(shapeTmp, ballA.x-27, ballA.y-27)
            shapeTmp = animationHelper(shapeInd_B_pre)

        myTimeout11 = setTimeout(function() {  
            ballA.draw_balls();

            myTimeout12 = setTimeout(function() {
                animate();
            },colorDisk)
        },previewShape)
    },colorDisk)
}

let refresh_stimuliOnset_test = 0; //DO NOT make these const - even though they don't change it causes the occluder to disappear
let myTimeout;
let myReq;
let startResponseTiming = false;

function animate() { // make the disks and the shapes move together and occluders move off screen 
    myTimeout = setTimeout (function() {     
    ctx_L.fillStyle = 'gray';
    ctx_L.clearRect(0,0,canvas_L.width, canvas_L.height);
if (trainingTrial < trialsInfo_training.length) {
    vertical_tmp_A = trialsInfo_training[trainingTrial].ball_A_vertical;
}
if (trainingTrial === trialsInfo_training.length && curTrial < trialsInfo.length) {
    vertical_tmp_A = trialsInfo[curTrial].ball_A_vertical;
}
    ballA.draw_balls();
    ballA.updatePosition();
    refresh_stimuliOnset_test ++;
    
    if (refresh_stimuliOnset_test < 76) {
        if (trialsInfo_training[trainingTrial].trialType === "OSPB" || trialsInfo[curTrial].trialType === "OSPB") {
            occluderA.draw_occluder()
            occluderB.draw_occluder()
        } else {
            occluderC.draw_occluder()
        }
        myReq = requestAnimationFrame(animate);
    } else { //after this period, occluder becomes two occluders(MODAL) then move offscreen (OSPB + MODAL)
        //if OSPB {
            // move top one up and bottom one down
        //} else {
            // 
        //}
       if (trainingTrial < trialsInfo_training.length) {
            shapeInd_A_test = trialsInfo_training[trainingTrial].shape_A_test_ind;
        }

        if (trainingTrial >= trialsInfo_training.length && curTrial >=0) {
            shapeInd_A_test = trialsInfo[curTrial].shape_A_test_ind;
        }
        shapeTmpA = animationHelper(shapeInd_A_test)

         if (refresh_stimuliOnset_test === 84) { 

            setTimeout(function() {
                if ((trialsInfo_training[trainingTrial] && trialsInfo_training[trainingTrial].spatiotemporalType === "incongruent")
                 || (trialsInfo[curTrial] && trialsInfo[curTrial].spatiotemporalType === "incongruent")) { //swap
                    //ball should show up behind the wrong occluder
                    ctx_L.drawImage(shapeTmpA, ballA.x-27, ballA.y-27);
                 } else {
                    //ball w shape shows up behind the correct occluder
                    ctx_L.drawImage(shapeTmpA, ballA.x-27, ballA.y-27);
                 }
                 responseAcceptable = true; // only allow response when the occluder is removed/equivalent time in no occluder condition
                }, 1000);
         }  else {
            myReq = requestAnimationFrame(animate); 
            }
    }  
    }, freshRate)
}
/* 
Given value, chooses which of 5 shapes to display.
JS passes by value not reference so you can't assign values to a variable by passing it as a parameter.
*/
function animationHelper(shapeTest) {
    let shapeTMP;
    switch (shapeTest) {
      case 0:
        shapeTMP = document.getElementById("shape0");
        break;
      case 1:
        shapeTMP = document.getElementById("shape1");
        break;
      case 2:
        shapeTMP = document.getElementById("shape2");
        break;
      case 3:
        shapeTMP = document.getElementById("shape3");
        break;
      case 4:
        shapeTMP = document.getElementById("shape4");
        break;
    }
    return shapeTMP;
  }

// record keyboard response
window.addEventListener('keydown', function(e) {
if (responseAcceptable === true) {
    if (e.key === '1' || e.key === '2') {
        endTrialTime = new Date();
        window.cancelAnimationFrame(myReq);
        clearTimeout(myTimeout);
        refresh_stimuliOnset_test = 0;
        $('#canvas_L').hide();
        $('#Instruction4').show();
        if (trainingTrial <= trialsInfo_training.length-1) {
            $('#nextTrainingTrialButton').show();
        } 
        if (trainingTrial === trialsInfo_training.length && curTrial>=0) {
            $('#nextTrialButton').show();
        }
        ballA.x = halfCanvasWidth-230;
        ballA.y = halfCanvasHeight;
        
        trialsInfo[curTrial].endTime = endTrialTime;
        trialsInfo[curTrial].reactTime = endTrialTime - startTrialTime-colorDisk-previewShape-colorDisk-76*20;    
    }
    if (e.key === '1') {
        trialsInfo[curTrial].responseC = 1; 
    }
    if (e.key === '2') {
        trialsInfo[curTrial].responseC = 0;  
    }
}           
}, false);
// save json file to local device
function download(content, fileName, contentType) {
    let a = document.createElement("a");
    let file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
};

/* wait for clicks */
// Testing data posting
$('#consented').click(showInstructions);
$('#continueInstructionButton1').click(continueInstruction1);
$('#startTrainingButton').click(function() {
    showTrials('a');
});
$('#nextTrainingTrialButton').click(function() {
    showTrials('b');});
$('#startExpButton').click(function() {
    showTrials('c');});
$('#nextTrialButton').click(function() {
    showTrials('d');});
$('#submitButton').attr("onclick", "postData()");