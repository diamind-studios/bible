//build query for pulling chapter text
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
      id,
      word||COALESCE(punctuation,'') as word,
      verse
    from books b 
    inner join ${payload.type}_text t
      on t.book = b.id
    where b.name = '${payload.searchPayload.book}'
      and t.${payload.type}_id = ${payload.typeId}
      and t.chapter = ${payload.searchPayload.chapter};`
  }
  return queries[payload.type]
}
  
//joins rows from db
const joinVerses = async (rows, delimiter=' ') => {
  const tab = document.createElement('span')
  output = ''
  for (let row of rows) {
    output += `<b>${row.verse}.</b> ${delimiter}${row.verse_text}<br><br>`
  }
  tab.innerHTML = output||'<i>Passage unavailable for the selected Bible.</i>'
  return tab
}
  
const joinWords = async (rows, delimiter=' ') => {
  const tab = document.createElement('span')
  let verse = 1
  tab.innerHTML = `<b>${verse}.</b> `

  for (row of rows) {
    if (row.verse != verse) { // add verse number
      verse = row.verse
      tab.innerHTML += `<br><br><b>${row.verse}.</b> `
    }
    let word = document.createElement('span')
    word.classList.add('word')
    word.innerText = row.word
    tab.appendChild(word)
    tab.innerHTML += ' '
  }
  tab.innerHTML += '<br><br>'
  return tab
}

const displayTag = async (selector, tag) => {
  const element = document.getElementById(selector)
  element.innerHTML = ''
  if (tag) element.appendChild(tag)
}

const parseSearchQuery = async (searchText) => {
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

// This runs after DOM loads
const display = async (selector, text) => {
  const element = document.getElementById(selector)
  if (element) element.innerHTML = text
}

module.exports = {
  'buildQuery': buildQuery,
  'joinVerses': joinVerses,
  'joinWords': joinWords,
  'displayTag': displayTag,
  'parseSearchQuery': parseSearchQuery,
  'display': display
}