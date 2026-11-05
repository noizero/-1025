# モーター性能計算ツール

GitHub Pagesで公開できる、ブラウザ動作のモーター性能計算サイトです。

## 公開方法（GitHub Pages）

1. GitHubで新しいリポジトリを作成します（例：`motor-performance-calculator`）。
2. このZIPを展開し、中にある `index.html`、`css`、`js`、`README.md` をリポジトリの直下にアップロードします。
3. GitHubリポジトリの **Settings → Pages** を開きます。
4. **Build and deployment** の Source を `Deploy from a branch` にします。
5. Branch を `main`、Folder を `/(root)` にして Save を押します。
6. 数分後、Pages画面に表示されるURLでサイトを開けます。

## ファイル構成

```text
motor-performance-calculator/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   ├── motor-data.js
│   ├── dc-calculator.js
│   └── gear-calculator.js
└── README.md
```

## 第1版の対応範囲

- モーター分類：DC / AC / その他
- DC方式：ブラシ付き / ブラシレス（BLDC）
- 仕様タイプ：一般 / 工進 KP-104 / 独自仕様
- ブラシ付きDCモーター：実電流入力モード、電流上限モード
- 回転数、トルク、電気入力、機械出力、効率の簡易計算
- ギヤ比・ギヤ効率を使った出力軸計算

現時点で計算モデルが実装されているのはブラシ付きDCモーターです。BLDC・ACは選択UIのみで、専用計算式は今後追加します。

## 重要な注意

- 未入力の値は自動補完しません。
- KP-104のポンプ仕様とモーター単体仕様を混同しません。未確認のモーター定数は空欄です。
- 計算は簡易モデルです。実機の設計・安全確認にはメーカー資料、実測、温度・電流・回転数の制限確認が必要です。
- GitHub Pagesは静的サイトの公開機能です。この構成ではサーバーやデータベースを使用しません。
