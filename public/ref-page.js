// ref.html: every quick-reference card from ref.js, all open, with a table of contents.
import {REF} from './ref.js';
const $ = s => document.querySelector(s), r = new URLSearchParams(location.search).get('r');
if (/^[A-Z0-9]{4}$/.test(r || '')) $('.back-nav').href = '/?r=' + r;
$('#toc').innerHTML = REF.map(x => `<a href="#${x.id}">${x.title.split('：')[0]}</a>`).join('');
$('#ref').innerHTML = REF.map(x => `<section class="card refcard" id="${x.id}"><h2>${x.title}</h2>${x.html}</section>`).join('');
if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
