# 微信开发者工具 CLI 预览

如果本机安装了微信开发者工具，并开启「服务端口」，可使用 CLI 自动上传/预览。

macOS 示例：

```bash
/Applications/wechatwebdevtools.app/Contents/MacOS/cli open --project /root/shuaci-english
/Applications/wechatwebdevtools.app/Contents/MacOS/cli preview --project /root/shuaci-english --qr-format terminal
```

Windows 示例：

```powershell
"C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat" open --project C:\path\to\shuaci-english
"C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat" preview --project C:\path\to\shuaci-english --qr-format image --qr-output preview.png
```

当前服务器环境通常没有 GUI 版微信开发者工具，所以这里提供项目侧配置与清单，真机预览需要在你的电脑上完成。
