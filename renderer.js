// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

//\const sqlite3 = require('sqlite3').verbose();
//var db = new sqlite3.Database('bible.db');

function search() {
    let displayAreaId = 'bible-text'
    const searchText = document.getElementById('searchText').value
    if (!searchText) return
    //db.each("SELECT * from books where id = 1;", function(err, row) {
    //  textArea.innerHTML += row.id + ": " + row.name + '<br>'
    //});
    
    //let bookNames = DB.bookName()
    DB.getPassage(displayAreaId, searchText)
    //for (book of bookNames) {
    //    textArea.innerText += book+' '
    //}
  }

//document.getElementById("search-button").addEventListener("click", search);
document.getElementById("search-form").addEventListener("submit", search, false);
