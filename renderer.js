// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

//\const sqlite3 = require('sqlite3').verbose();
//var db = new sqlite3.Database('bible.db');

function search(event) {
    event.preventDefault();
    const searchText = document.getElementById('searchText').value
    if (!searchText) return    
    DB.getPassage(searchText)
  }
function newTab() {
    const tabs = document.getElementById('tabs')
    const main = document.getElementById('main')
    const tabCount = tabs.childElementCount
    tabs.innerHTML += `<select id="${tabCount+1}" class="tab"></select>`
    main.innerHTML += `<div id="tab${tabCount+1}" class="tabBody"></div>`
    DB.newTab(tabCount+1)
}

//document.getElementById("search-button").addEventListener("click", search);
document.getElementById("search-form").addEventListener("submit", search);
document.getElementById("newtab").addEventListener("click", newTab, false);