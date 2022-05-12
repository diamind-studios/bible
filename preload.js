const {contextBridge} = require('electron')
const sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./bible.db');

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.


// This runs after DOM loads
const display = async (selector, text) => {
  const element = document.getElementById(selector)
  if (element) element.innerHTML = text
}

window.addEventListener('DOMContentLoaded', () => {
  //return
  //select all the translations and sources and add them to the selectors
  const tabs = document.getElementById('tabs') 
  for (tab of tabs.children) {
    getVersions(tab.id)
    //eventually pull open tabs from previous session, with the corrected "selected" option for each
  }
  
})

const getVersions = async (tabId,selected='2translation') => { // selected param should be an id+source type 
  const query = `select name, id, 'source' as type from sources s where complete
  union select name, id, 'translation' as type from translations t where complete
  order by type desc, id;`
  await db.all(query, async (err, rows) => {
    var output = ''
    for (row of rows) {
      if (row.id == 1) output+= `<optgroup label="${row.type[0].toUpperCase()+row.type.slice(1)}:">`
      output += `<option value="${row.id}" type="${row.type}" ${row.id+row.type == selected ? 'selected' : ''}>${row.name}</option>`
    }
    display(tabId, output)
  });
}

const parseQuery = async (searchText) => {
  searchText = searchText.replace(/ {2,}/g," ").split(' ')
  let rtn = {}
  // test array for these values: [['1','sam'], ['gen'], ['gen', '4'], ['1','sam','5'], ['g', '1:5'],['song','of','songs','1']]
  //test: for (s of x) {console.log('searched:',s); console.log('book:',bk(s)); console.log('chapter:',ch(s)); console.log('verse:',ver(s)); console.log()}
  // if 1st item is number: always checks for 2 
  rtn.book = (Number(searchText[0])) ? searchText.slice(0,searchText.length-2 ? searchText.length-1 : 2||2).join(' ') : searchText.slice(0,searchText.length-1||1).join(' ')
  rtn.chapter = (Number(searchText[0])) ? searchText.slice(searchText.length-2 ? searchText.length-1 : 2||1).join(' ').split(':')[0]||'1' : searchText.slice(searchText.length-1||1).join(' ').split(':')[0]||'1'
  rtn.verse = searchText.slice(searchText.length-1).join(' ').split(':')[1]||'1'
  return rtn
}

//joins rows from db
const joinVerses = async (rows, delimiter=' ') => {
  output = ''
  for (let row of rows) {
    output += `<b>${row.verse}.</b> ${delimiter}${row.verse_text}<br><br>`
  }
  return output||'<i>Passage unavailable for the selected Bible.</i>'
}

const buildQuery = async (payload) => {
  queries = {
    'translation': `select 
      verse_text, 
      verse
    from books b 
    inner join ${payload.type}_text t
      on t.book = b.id
    where b.name = '${payload.searchPayload.book}'
      and t.${payload.type}_id = ${payload.typeId}
      and t.chapter = ${payload.searchPayload.chapter};`,
    'source': `select 
      group_concat(word||COALESCE(punctuation,''),' ') as verse_text, 
      verse
    from books b 
    inner join ${payload.type}_text t
      on t.book = b.id
    where b.name = '${payload.searchPayload.book}'
      and t.${payload.type}_id = ${payload.typeId}
      and t.chapter = ${payload.searchPayload.chapter}
    group by verse;`
  }
  return queries[payload.type]
}

const getBook = async (searchText) => {
  const searchPayload = await parseQuery(searchText)
  const query = `select 
    name
  from books b 
  where b.name like '${searchPayload.book}%'
  limit 1
  ;`
  await db.all(query, async (err, rows) => {
    //everything you wanna do with the data returned has to go in here
    if (rows.length < 1) return
    searchPayload.book = rows[0].name
    for (element of document.getElementById('tabs').children) {
      getTextInfo(element.id, searchPayload)
    }
    display('bible-header',`${searchPayload.book} ${searchPayload.chapter}`)
  });
}

const getTextInfo = async (id, searchPayload) => {
  let payload = {searchPayload}
  const select = document.getElementById(id)
  const selectedIndex = select.selectedIndex
  payload.typeId = select[selectedIndex].value//document get chosen translation
  payload.type = select[selectedIndex].getAttribute('type')
  payload.textName = select[selectedIndex].text
  
  const queries = {
    'translation': `select 
      full_name, 
      license
    from translations t
    where id = ${payload.typeId};`,
    'source': `select 
      full_name,
      'Public Domain' as license
    from sources s 
    where s.id = ${payload.typeId};`
  }
  await db.all(queries[payload.type], async (err, rows) => {
    payload.fullTextName = rows[0].full_name
    payload.license = rows[0].license
    getText(id, payload)
  });
}

const getText = async (id, payload) => {
  
  const query = await buildQuery(payload)
  console.log(payload.textName + payload.typeId)

  await db.all(query, async (err, rows) => {
    //everything you wanna do with the data returned has to go in here
    const output = `<h2>${payload.fullTextName}</h2>` + await joinVerses(rows,' ') + `<label>${payload.fullTextName}</label><br><i>LICENSE: ${payload.license||'Public Domain'}</i>`
    display('tab'+id, output)
  });
}



// These functions are exposed for calling from front end
contextBridge.exposeInMainWorld('DB', {
  getPassage: (searchText) => {
    getBook(searchText)
  },
  newTab: (tabId) => {
    getVersions(tabId)
  }
})

