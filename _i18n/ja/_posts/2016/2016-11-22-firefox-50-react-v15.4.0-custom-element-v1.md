---
title: "2016-11-22のJS: Firefox 50、React v15.4.0、Custom Element v1"
author: azu
layout: post
date : 2016-11-22T10:06
category: JSer
tags:
    - Firefox
    - React
    - WebKit
    - WebComponents

---

JSer.info #306

----
<h1 class="site-genre">ヘッドライン</h1>

----

## Firefox 50.0 リリースノート
[www.mozilla.jp/firefox/50.0/releasenotes/](https://www.mozilla.jp/firefox/50.0/releasenotes/ "Firefox 50.0 リリースノート")

<p class="jser-tags jser-tag-icon"><span class="jser-tag">firefox</span> <span class="jser-tag">ReleaseNote</span></p>

Firefox 50リリース。
WebM EMEのサポート、`Symbol.hasInstance`の実装、コンソールがSource Mapを解釈するように。
`addEventListener`が`once`オプション、`X-Content-Type-Options`ヘッダーのサポート、など

- [Firefox 50 for developers - Mozilla | MDN](https://developer.mozilla.org/ja/Firefox/Releases/50 "Firefox 50 for developers - Mozilla | MDN")
- [Firefox 50 サイト互換性情報 | Firefox サイト互換性情報](https://www.fxsitecompat.com/ja/versions/50/ "Firefox 50 サイト互換性情報 | Firefox サイト互換性情報")

----

## Release Notes for Safari Technology Preview 18 | WebKit
[webkit.org/blog/7078/release-notes-for-safari-technology-preview-18/](https://webkit.org/blog/7078/release-notes-for-safari-technology-preview-18/ "Release Notes for Safari Technology Preview 18 | WebKit")

<p class="jser-tags jser-tag-icon"><span class="jser-tag">webkit</span> <span class="jser-tag">ReleaseNote</span></p>

Safari Technology Preview Release 18リリース。

----

## React v15.4.0 - React Blog
[facebook.github.io/react/blog/2016/11/16/react-v15.4.0.html](https://facebook.github.io/react/blog/2016/11/16/react-v15.4.0.html "React v15.4.0 - React Blog")

<p class="jser-tags jser-tag-icon"><span class="jser-tag">React</span> <span class="jser-tag">ReleaseNote</span></p>

React v15.4.0リリース。
内部的に存在していた `react/lib/*` のPrivate APIを削除、`?react_perf`を付けることでUser Timingベースのプロファイリングを取れるようになるなど

----

## 6.19.0 Released · Babel
[babeljs.io/blog/2016/11/16/6.19.0](https://babeljs.io/blog/2016/11/16/6.19.0 "6.19.0 Released · Babel")

<p class="jser-tags jser-tag-icon"><span class="jser-tag">babel</span> <span class="jser-tag">ReleaseNote</span></p>

Babel v6.19.0リリース。
babel-plugin-transform-object-rest-spreadが単独のPluginとして動くように。
stage-2 presetに`babel-plugin-syntax-dynamic-import`を追加など

- [Object rest spread transform · Babel](http://babeljs.io/docs/plugins/transform-object-rest-spread/ "Object rest spread transform · Babel")

----

## Release 0.17.0 · avajs/ava
[github.com/avajs/ava/releases/tag/v0.17.0](https://github.com/avajs/ava/releases/tag/v0.17.0 "Release 0.17.0 · avajs/ava")

<p class="jser-tags jser-tag-icon"><span class="jser-tag">node.js</span> <span class="jser-tag">testing</span> <span class="jser-tag">ReleaseNote</span></p>

AVA 0.17.0リリース。
`process.cws()`を`package.json`と同じディレクトリに変更、Node.js v4>=のみのサポート、`--require` CLIオプションの削除、`karma-ava`のサポートなど

- [avajs/ava-codemods: Codemods for AVA](https://github.com/avajs/ava-codemods#migrating-to-ava "avajs/ava-codemods: Codemods for AVA")

----

## Release fetch 2.0.0 · github/fetch
[github.com/github/fetch/releases/tag/v2.0.0](https://github.com/github/fetch/releases/tag/v2.0.0 "Release fetch 2.0.0 · github/fetch")

<p class="jser-tags jser-tag-icon"><span class="jser-tag">JavaScript</span> <span class="jser-tag">github</span> <span class="jser-tag">library</span></p>

Fetch APIのpolyfillライブラリである`fetch` 2.0.0リリース。
`Header.get()`の挙動変更、`Headers.getAll()`の削除など

----

## Angular 2.2.0 Now Available
[angularjs.blogspot.com/2016/11/angular-220-now-available.html](http://angularjs.blogspot.com/2016/11/angular-220-now-available.html "Angular 2.2.0 Now Available")

<p class="jser-tags jser-tag-icon"><span class="jser-tag">AngularJS</span> <span class="jser-tag">ReleaseNote</span></p>

AngularJS 2.2.0リリース。
`@anguar/upgrade`を使い1.xと2.xを共存させる場合にRouterでどちらも扱えるようにする仕組みの追加、JavaScriptで使う場合のガイドの追加など

- [TypeScript to JavaScript - ts - COOKBOOK](https://angular.io/docs/ts/latest/cookbook/ts-to-js.html "TypeScript to JavaScript - ts - COOKBOOK")
- [Migrating Angular 1 Applications to Angular 2 in 5 Simple Steps](https://vsavkin.com/migrating-angular-1-applications-to-angular-2-in-5-simple-steps-40621800a25b "Migrating Angular 1 Applications to Angular 2 in 5 Simple Steps")

----

## These Weeks in Firefox: Issue 5 | Firefox Nightly News
[blog.nightly.mozilla.org/2016/11/16/these-weeks-in-firefox-issue-5/](https://blog.nightly.mozilla.org/2016/11/16/these-weeks-in-firefox-issue-5/ "These Weeks in Firefox: Issue 5 | Firefox Nightly News")

<p class="jser-tags jser-tag-icon"><span class="jser-tag">firefox</span> <span class="jser-tag">ReleaseNote</span></p>

Firefox Nightly 52における変更点のハイライト。
async/awaitの対応、ネットワークのスロットリングツールの追加、`<input type="time">`のUI改善など

----
<h1 class="site-genre">アーティクル</h1>

----

## Introducing Custom Elements | WebKit
[webkit.org/blog/7027/introducing-custom-elements/](https://webkit.org/blog/7027/introducing-custom-elements/ "Introducing Custom Elements | WebKit")

<p class="jser-tags jser-tag-icon"><span class="jser-tag">WebComponents</span></p>

Custom Elementについて。
HTMLElementのサブクラスでの定義、ライフサイクルのコールバックイベントは同期的に呼ばれる点について。
また、非同期でCustom Elementが`deinfe`されたことを`whenDefined`で検知する方法について

----

## How to win in Web Framework Benchmarks – Medium
[medium.com/@localvoid/how-to-win-in-web-framework-benchmarks-8bc31af76ce7](https://medium.com/@localvoid/how-to-win-in-web-framework-benchmarks-8bc31af76ce7 "How to win in Web Framework Benchmarks – Medium")

<p class="jser-tags jser-tag-icon"><span class="jser-tag">JavaScript</span> <span class="jser-tag">DOM</span> <span class="jser-tag">VirtualDOM</span> <span class="jser-tag">benchmark</span></p>

kiviというReactのようなUIライブラリを作っていくにあたりベンチマークを見てどのような最適化をしていくかという話。
色々なDOMライブラリのベンチマークを試し、どのような点を改善すれば結果がよくなったかという話

- [localvoid/kivi: Javascript (TypeScript) library for building web user interfaces](https://github.com/localvoid/kivi "localvoid/kivi: Javascript (TypeScript) library for building web user interfaces")

----

## Choosing Ember over React in 2016
[blog.instant2fa.com/choosing-ember-over-react-in-2016-41a2e7fd341](https://blog.instant2fa.com/choosing-ember-over-react-in-2016-41a2e7fd341 "Choosing Ember over React in 2016")

<p class="jser-tags jser-tag-icon"><span class="jser-tag">JavaScript</span></p>

Instant 2FAというサービスをEmberで作ってみて良かったところと良くなかったところについて。
`ember-cli`について

----

## for..in versus for..of Loops
[bitsofco.de/for-in-vs-for-of/](https://bitsofco.de/for-in-vs-for-of/ "for..in versus for..of Loops")

<p class="jser-tags jser-tag-icon"><span class="jser-tag">JavaScript</span></p>

`for...of`と`for...in`の違いについて

----
<h1 class="site-genre">スライド、動画関係</h1>

----

## React with Reduxによる大規模商用サービスの開発 / nodefest2016 // Speaker Deck
[speakerdeck.com/yoshidan/nodefest2016](https://speakerdeck.com/yoshidan/nodefest2016 "React with Reduxによる大規模商用サービスの開発 / nodefest2016 // Speaker Deck")

<p class="jser-tags jser-tag-icon"><span class="jser-tag">React</span> <span class="jser-tag">redux</span> <span class="jser-tag">スライド</span></p>

React + Reduxにおける注意点について。
画面遷移とJavaScriptファイルの分割、サーバサイドレンダリングの手法とコストについて

- [React + Reduxで作ったIsomorphic(Universal) JSなサービス開発の裏側 - Tech Blog - Recruit Lifestyle Engineer](http://engineer.recruit-lifestyle.co.jp/techblog/2016-11-16-isomorphic-javascript/ "React + Reduxで作ったIsomorphic(Universal) JSなサービス開発の裏側 - Tech Blog - Recruit Lifestyle Engineer")

----

## 💓 Vue.js
[nakajmg.github.io/s/161119-vue/](https://nakajmg.github.io/s/161119-vue/ "💓 Vue.js")

<p class="jser-tags jser-tag-icon"><span class="jser-tag">JavaScript</span> <span class="jser-tag">library</span> <span class="jser-tag">スライド</span></p>

Vue.jsについてのスライド。
コンソールにTranscriptが出る。
Vue.js 2.xの特徴やエコシステム、ツールなどについて

----

## about\_hiroppyさんの「ECMAScript」 / about\_hiroppy さん - ニコナレ
[niconare.nicovideo.jp/watch/kn1937](http://niconare.nicovideo.jp/watch/kn1937 "about\_hiroppyさんの「ECMAScript」 / about\_hiroppy さん - ニコナレ")

<p class="jser-tags jser-tag-icon"><span class="jser-tag">JavaScript</span> <span class="jser-tag">スライド</span></p>

ECMAScriptの策定プロセスとES2016/2017について

- [ECMAScript / about\_hiroppy さん - ニコナレ](http://niconare.nicovideo.jp/watch/kn1936 "ECMAScript / about\_hiroppy さん - ニコナレ")

----
<h1 class="site-genre">ソフトウェア、ツール、ライブラリ関係</h1>

----

## paulirish/pwmetrics: Progressive web metrics at your fingertipz
[github.com/paulirish/pwmetrics](https://github.com/paulirish/pwmetrics "paulirish/pwmetrics: Progressive web metrics at your fingertipz")

<p class="jser-tags jser-tag-icon"><span class="jser-tag">performance</span> <span class="jser-tag">Tools</span></p>

lighthouseを使ったパフォーマンスメトリクスの可視化ツール

- [GoogleChrome/lighthouse: auditing and performance metrics for Progressive Web Apps](https://github.com/GoogleChrome/lighthouse/ "GoogleChrome/lighthouse: auditing and performance metrics for Progressive Web Apps")

----

## dylanb/react-axe: Accessibility auditing for React.js applications
[github.com/dylanb/react-axe](https://github.com/dylanb/react-axe "dylanb/react-axe: Accessibility auditing for React.js applications")

<p class="jser-tags jser-tag-icon"><span class="jser-tag">React</span> <span class="jser-tag">accessibility</span> <span class="jser-tag">library</span></p>

axe-coreをつかったアクセシビリティチェックを行うReactライブラリ

----

## Victory
[formidable.com/open-source/victory/](https://formidable.com/open-source/victory/ "Victory")

<p class="jser-tags jser-tag-icon"><span class="jser-tag">React</span> <span class="jser-tag">グラフ</span> <span class="jser-tag">library</span></p>

React Componentとしてグラフを書く事ができるライブラリ。

- [Flexible Charting in React with Victory (and Introducing FormidableCharts) | Formidable](https://formidable.com/blog/2016/11/09/flexible-charting-in-react-with-victory/ "Flexible Charting in React with Victory (and Introducing FormidableCharts) | Formidable")

----
