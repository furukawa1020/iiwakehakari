# いいわけ秤

AIの判断に、理由の重さで交渉する卓上デバイス「いいわけ秤」の提出用スライドサイトです。
CUI / GUI / Zero UI の先にある Negotiable UI という視点を、作品のナラティブに含めています。

## ローカル確認

静的サイトなので、`index.html` をブラウザで開けば確認できます。

ローカルサーバーで確認する場合:

```powershell
python -m http.server 4173
```

その後、`http://localhost:4173` を開きます。

## Netlify

Netlifyではリポジトリを接続し、Publish directory を `.` にしてください。
`netlify.toml` にも同じ設定を入れています。
