// ==UserScript==
// @name         SutBot
// @namespace    http://tampermonkey.net/
// @version      2024-08-10
// @description  try to take over the world!
// @author       Julien Guitter
// @match        https://sutom.nocle.fr
// @icon         https://sutom.nocle.fr/favicon.ico
// @grant        none
// ==/UserScript==

/*
    SutBot
    Created by Julien Guitter
    Version 2024-08-10
    Description : This bot will help you to complete the Sutom game.
*/

document.getElementsByTagName("body")[0].innerHTML += `
    <style>
        .SutBot{
            display: flex; 
            flex-direction: column; 
            position: absolute; 
            top:50%; right: 0; 
            transform: translateY(-50%); 
            border: 2px solid var(--couleur-bordure);
            border-right: none; 
            border-radius: 15px 0 0 15px; 
            padding: 20px 40px;
        }

        .SutBot-btn{
            margin: 0 0 20px 0; 
            font-size: 17px; 
            font-weight: bold; 
            padding: 5px 10px;
            background-color: var(--couleur-lettre-speciale);
            border-color: var(--couleur-lettre-speciale);
            border-radius: 5px;
            color: var(--couleur-police);
            width: 100%;
        }

        .SutBot-btn:hover{
            background-color: var(--couleur-lettre-speciale-survole);
            border-color: var(--couleur-lettre-speciale-survole);
            cursor: pointer;
        }

        .SutBot-title{
            text-align: center; 
            font-size: 36px; 
            margin: 0 0 20px 0;
        }

        .SutBot-text{
            text-align: center; 
            margin: 0; 
            font-size: 20px;
        }

        .SutBot-link{
            text-align: center; 
            margin: 0; 
            font-size: 15px; 
            color: var(--couleur-police);
        }
        .SutBot-link:hover{
            color: var(--couleur-lettre-survole-mal-place);
        }

        .SutBot-container{
            display: flex; 
            flex-direction: column; 
            align-items: center;
        }
    </style>
    <div class="SutBot">
        <h2 class="SutBot-title">SutBot</h2>
        <div id="SutBot-container-btn" class="SutBot-container" style="display: flex;">
            <button id="SutBot-run"  class="SutBot-btn">Complete grid</button>
            <button id="SutBot-reset" class="SutBot-btn">Reset Data</button>
        </div>
        <div id="SutBot-container-information" class="SutBot-container" style="display: none;">
            <span class="SutBot-text"><span id="SutBot-right">0</span> Right Char</span>
            <span class="SutBot-text"><span id="SutBot-possible">0</span> Possible</span>
            <br>
        </div>
        <span class="SutBot-text">Created By</span>
        <a href="https://github.com/JulienGuitter" class="SutBot-link">Julien Guitter</a>
    </div>
                                                    `;

let run_sutbot = document.querySelector("#SutBot-run");
let resetAll = document.querySelector("#SutBot-reset");
let countPossibleWords = document.querySelector("#SutBot-possible");
let rightChar = document.querySelector("#SutBot-right");
let containerBtn = document.querySelector("#SutBot-container-btn");
let containerInformation = document.querySelector("#SutBot-container-information");

//get element from page
let btn_popup = document.querySelector("#panel-fenetre-bouton-fermeture");
let popup = document.querySelector("#panel-area");
let listKey = document.getElementsByClassName("input-lettre");
let keyBoard = {};
let enterButton;
let gridLines = [];

//All global variables
let dictionary;
let updatedDictionary;
let findedWords;
let disableLetter;
let wrongPlaceLetter;
let lineId;
let intervalId;
let jsUsed;
let end;

(function() {
    'use strict';

    window.addEventListener('load', function() {
        // btn_popup.click();
    })
})();

run_sutbot.addEventListener("click", function(){
    init();
    processSutBot();
    intervalId = setInterval(processSutBot, 3000);
});

resetAll.addEventListener("click", function(){
    // reset all local storage
    if(confirm("This will reset all your previous parties. Are you sure ?")){
        localStorage.clear();
        window.location.reload();
    }
});

function init(){
    console.log("Init SutBot")

    lineId = -1;
    dictionary = [];
    updatedDictionary = [];
    findedWords = [];
    disableLetter = [];
    wrongPlaceLetter = {};
    jsUsed = [];
    end = false;
    countPossibleWords.innerHTML = 0;
    rightChar.innerHTML = 0;

    updateGrid();

    initKeyboard();

    const scripts = document.querySelectorAll('head script');

    let dayDictAddress = "";

    // Get the address of the dictionary
    scripts.forEach(script => {
        if(script.src.includes('js/mots/')) {
            let scriptpath = script.src;
            if(jsUsed.indexOf(scriptpath) == -1){
                console.log("script found");
                dayDictAddress = scriptpath;
                jsUsed.push(scriptpath);
            }
        }
    });

    // Get the dictionary of the day
    function httpGet(theUrl) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", theUrl, false);
        xmlHttp.send(null);
        return xmlHttp.responseText;
    }

    var tempListMots = httpGet(dayDictAddress);

    var regex = /ListeMotsProposables\.Dictionnaire\s*=\s*(\[[^\]]*\])/;
    var match = tempListMots.match(regex);

    if (match && match[1]) {
        dictionary = eval(match[1]);
        updatedDictionary = dictionary
        console.log("Dictionnaire chargé");
    } else {
        console.log("Variable non trouvée ou mal formée");
    }

    // Check witch line we are
    for(let j = 0; j < gridLines.length; j++){
        let countValide = 0;
        for(let i = 0; i < gridLines[j].children.length; i++){
            if(gridLines[j].children[i].innerHTML == "."){
                lineId = j;
                break;
            }
            if(gridLines[j].children[i].className == "bien-place resultat"){
                countValide+=1;
            }
        }
        
        if(countValide == gridLines[j].children.length || (j == gridLines.length - 1 && lineId == -1)){
            endGame();
            return;
        }
    }
    if(lineId == -1){
        console.log("Line not found");
    }


    //init empty array
    for(let i = 0; i < dictionary[0].length; i++){
        findedWords.push("");
    }

    if(lineId == 0){
        //Partie not started
        findedWords[0] = dictionary[0][0];
    } else {
        //Partie already started
        for(let i = 0; i < lineId; i++){
            AnalyseLetterInLine(i);
        }
    }

    
    containerBtn.style.display = "none";
    containerInformation.style.display = "flex";
}

function updateGrid(){
    gridLines = document.querySelectorAll("#grille table tr");
}

function processSutBot(){
    if(end){
        endGame();
        return;
    }
    if(lineId != 0 && lineId != -1){
        updateGrid();
        AnalyseLetterInLine(lineId-1);
    }
    popup = document.querySelector("#panel-area");
    // if(popupTitle.innerHTML != "Félicitations" && popupTitle.innerHTML != "Perdu"){
    if(popup.style.display != "block"){
        // console.log("findedWords : ", findedWords);
        // console.log("disableLetter : ", disableLetter);
        // console.log("wrongPlaceLetter : ", wrongPlaceLetter);

        updateWordList()
        // console.log("Updated dictionary : ", updatedDictionary);


        var randomWord = Math.floor(Math.random() * updatedDictionary.length)
        writeWord(updatedDictionary[randomWord]);


        enterButton.click();
        lineId++;
    }else{
        endGame();
    }
}

function endGame(){
    end = true;
    containerBtn.style.display = "flex";
    containerInformation.style.display = "none";
    console.log("Partie terminée");
    clearInterval(intervalId);
}

function AnalyseLetterInLine(line){
    // return : [[letter, status], [letter, status], ...] - (letter : string, status : (0: not found, 1: found, 2: wrong place))
    let result = [];
    for(let i = 0; i < gridLines[line].children.length; i++){
        let letter = gridLines[line].children[i];
        let status = letter.className.split(" ")[0];

        switch(status){
            case "non-trouve":
                result.push([letter.innerHTML, 0]);
                break;
            case "bien-place":
                result.push([letter.innerHTML, 1]);
                break;
            case "mal-place":
                result.push([letter.innerHTML, 2]);
                break;
        }
    }
    updateletterInformation(result);
}

function wrongConatains(array2D, letter) {
    if (array2D === undefined) {
        return false;
    }
    for (const [key, value] of Object.entries(array2D)) {
        for(let j = 0; j < value.length; j++){
            if (value[j] === letter) {
                return true;
            }
        }
    }
    return false;
}

function updateletterInformation(lastWordInfo){
    // lastWordInfo : [[letter, status], [letter, status], ...] - (letter : string, status : (0: not found, 1: found, 2: wrong place))

    for(let i = 0; i < lastWordInfo.length; i++){
        let letter = lastWordInfo[i][0];
        let status = lastWordInfo[i][1];

        if(status == 0){
            if(disableLetter.indexOf(letter) == -1  && findedWords.indexOf(letter) == -1 && wrongConatains(wrongPlaceLetter, letter) == false){
                disableLetter.push(letter);
            }
        } else if(status == 2){
            if(wrongPlaceLetter[i] == undefined){
                wrongPlaceLetter[i] = [letter];
            } else {
                if(wrongPlaceLetter[i].indexOf(letter) == -1){
                    wrongPlaceLetter[i].push(letter);
                }
            }
        }else if(status == 1){
            findedWords[i] = letter;
        }
    }

    let count = 0;
    for(let i = 0; i < findedWords.length; i++){
        if(findedWords[i] != ""){
            count++;
        }
    }
    rightChar.innerHTML = count;

}

function updateWordList(){
    let newWordList = [];

    for(let i = 0; i < updatedDictionary.length; i++){
        let word = updatedDictionary[i];
        let wordStatus = 0;

        for(let j = 0; j < word.length; j++){
            if(findedWords[j] != ""){
                if(findedWords[j] != word[j]){
                    wordStatus = 1;
                    break;
                }else{
                    continue;
                }
            }
            if(disableLetter.indexOf(word[j]) != -1){
                wordStatus = 1;
                break;
            }
            if(wrongPlaceLetter[j] != undefined){
                if(wrongPlaceLetter[j].indexOf(word[j]) != -1){
                    wordStatus = 1;
                    break;
                }
            }
        }

        if(wordStatus == 0){
            newWordList.push(word);
        }
    }

    updatedDictionary = newWordList;
    countPossibleWords.innerHTML = updatedDictionary.length;
}

function writeWord(word){
    for(let i = 0; i < word.length; i++){
        keyBoard[word[i]][1].click();
    }
}

function initKeyboard(){
    for(let i = 0; i < listKey.length; i++){
        keyBoard[listKey[i].innerHTML] = [i, listKey[i]];
    }

    enterButton = listKey[listKey.length - 1];

    console.log("Keyboard initialized");
}
