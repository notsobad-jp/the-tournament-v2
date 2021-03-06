const functions = require('firebase-functions');
const admin = require('firebase-admin');
const riot = require('riot');
const fs = require('fs');
const xss = require('xss');
const CleanCSS = require('clean-css');
const RSS = require('rss');

const bracket = require('../tags/shared/bracket.tag');
const redraw = require('../tags/custom/redraw_rugby.tag');

// const ENV = 'production';
const ENV = 'staging';
const bucketName = 'app.the-tournament.jp'
const version = 'v1'
const storage_root = (ENV=='production') ? 'embed' : 'embed_stg';

var config = require('../cert_'+ ENV +'.json');
admin.initializeApp(config);

var autoLink = function(str) {
  // [text](url)のフォーマットで、テキストリンク化
  var regexp_url = /\[([^\]]+)\]\(([^)]+)\)/g; // ']))/;
  var regexp_makeLink = function(all, text, url) {
    return `<a href="${url}" target="_blank">${text}</a>`;
  }
  return str.replace(regexp_url, regexp_makeLink);
}


var minifyCss = function() {
  return Promise.all([
    new Promise(function(fulfilled, rejected){
      fs.readFile('./css/tournament.css', 'utf8', function (err, text) {
        var tnmtCss = new CleanCSS({}).minify(text);
        fulfilled(tnmtCss);
      })
    }),
    new Promise(function(fulfilled, rejected){
      fs.readFile('./css/flag.min.css', 'utf8', function (err, text) {
        var flagCss = new CleanCSS({ level: 0 }).minify(text);
        fulfilled(flagCss);
      })
    })
  ])
}



// 本番用(production)
// let id1 = 'ghzEs7dZG66QMGQQbwB3'
// let id2 = 'dXgn0F8WBYXpFYnlGWam'
// let id3 = '0cF3NmjAceIkMEbmQpY0'

// 検証用(staging)
let id1 = 'rlOcfVPvkZP6CN7XjLRs'
let id2 = 'kwjI5I4r63VtNQDyzIlC'
let id3 = 'qBXKkYedpDckPjIx1bQn'


let id = id1 + id2 + id3
admin.firestore().collection('tournaments').doc(id1).get().then(doc => {
  const tournament = doc.data();

  admin.firestore().collection('tournaments').doc(id2).get().then(doc2 => {
    const tournament2 = doc2.data();

    admin.firestore().collection('tournaments').doc(id3).get().then(doc3 => {
      const tournament3 = doc3.data();

      var html = riot.render(redraw, {tournament: tournament, tournament2: tournament2, tournament3: tournament3, editable: false, embed: true});
      html = html.replace(/\r?\n/g, '<br>');
      html = html.replace(/<\/?bracket>/g, '');
      html = autoLink(html);

      var header = function(){/*
        <!doctype html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>{{title}} | THE TOURNAMENT</title>
          <link rel="canonical" href="https://the-tournament.jp/tournaments/{{tournamentId}}">
          <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
          <link rel="icon" type="image/x-icon" href="https://app.the-tournament.jp/assets/img/favicon.ico">
          <style amp-custom>
            * { font-family: 'Lucida Grande','Hiragino Kaku Gothic ProN', Meiryo, sans-serif; }
            body { margin: 0; }
            a { text-decoration: none; }
            h1 { font-weight: lighter; font-size: 14px; }
            h1 small, h1 small a { font-size: 65%; font-weight: normal; line-height: 1; color: #999999; }
            body#embed{background:transparent}
            #emb-container{margin:10px}
            #emb-header{background:#333;color:#fff}
            #emb-header h1{font-size:14px;margin:0;padding:5px}
            #emb-header h1 small{margin-left:15px;}
            #emb-header a{color:#fff}
            #emb-body{background:#fff;padding:10px;border:1px solid #ddd;}
            #emb-body .bracket{margin-bottom:20px; overflow: auto;}
            #emb-body #emb-footer{margin-left:10px}
            #emb-ad{margin-bottom:5px}
            .closePopupBtn {
              position: absolute;
              top: -25px;
              right: 0;
              color: black;
              cursor: pointer;
            }
      */}.toString().match(/(?:\/\*(?:[\s\S]*?)\*\/)/).pop().replace(/^\/\*/, "").replace(/\*\/$/, "").replace("{{tournamentId}}", id).replace("{{title}}", tournament.title);

      return minifyCss().then(function(css){
        header += css[0]['styles'] + ' ' + css[1]['styles'];
        header += '.name { width: ' + tournament.nameWidth + 'px; }';
        header += '.score { width: ' + tournament.scoreWidth + 'px; }';

        // プロフィール画像表示
        if(tournament.profileImages) {
          header += '.profileImage { background-image: url("//'+ bucketName +'/'+ storage_root +'/'+ version +'/'+ id +'.png") }'
        }

        //FIXME: 柔道対応
        if(tournament.userId == '2652') {
          header += '#emb-body { border-style: none; } #emb-body .bracket { padding-bottom: 300px; }'
        }

        // カスタムCSS反映
        if(tournament.css) {
          header += tournament.css
        }

        header =  header.replace(/assets\/images\/flags.png/, 'https://app.the-tournament.jp/assets/img/flags.png');
        header += '</style>';

        // rugby対応：外部カスタムCSSを読み込み
        header += '<link rel="stylesheet" type="text/css" href="https://www.mbs.jp/rugby/css/the-tournament.css">';

        // privateトーナメントはnoindex
        if(tournament.private) {
          header += '<meta name="robots" content="noindex" />';
        }

        header += '<script async custom-element="amp-analytics" src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"></script>';
        header += '<script async custom-element="amp-ad" src="https://cdn.ampproject.org/v0/amp-ad-0.1.js"></script>';
        header += '<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>';
        header += `<script type="text/javascript">
          function closePopup(elm) {
            document.getElementById("bracket").focus();
          }
        </script>`;
        header += '<script async src="https://cdn.ampproject.org/v0.js"></script></head>';

        var container = '<body id="embed"><div id="emb-container"><div id="emb-header">';
        container += '<h1><a target="_blank" href="https://the-tournament.jp/tournaments/'+ id +'">'+ tournament.title;
        container += '</a><small> powered by <a href="https://the-tournament.jp/" target="_blank">THE TOURNAMENT</a> &nbsp;&nbsp;</small></h1></div><div id="emb-body">';
        container += '<amp-analytics type="googleanalytics"> <script type="application/json"> { "vars": { "account": "UA-30867542-19" }, "triggers": { "trackPageview": { "on": "visible", "request": "pageview" } } } </script> </amp-analytics> ';

        var file = admin.storage().bucket(bucketName).file(storage_root +'/'+ version +'/' + id + '.html');
        return file.save(header + container + html + '</div></div></body></html>', {
          metadata: { contentType: 'text/html' },
          gzip: true
        });
      })
    })
  })
})
