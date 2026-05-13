sudo vim /etc/hosts

127.0.0.1 local.admin.sarang-univ.com
127.0.0.1 local.api.sarang-univ.com

## 로컬 HTTPS 인증서 설정

로컬 개발 환경은 실제 도메인 형태의 HTTPS 주소와 macOS System Keychain에
등록된 Root CA를 사용합니다.

레포에는 아래 인증서 파일만 유지합니다.

- `sarang-univ-admin/ssl/local.admin.sarang-univ.com.crt`
- `sarang-univ-admin/ssl/local.admin.sarang-univ.com.key`
- `sarang-univ-server/ssl/local.api.sarang-univ.com.crt`
- `sarang-univ-server/ssl/local.api.sarang-univ.com.key`

Root CA 인증서는 레포에 별도 파일로 유지하지 않고, macOS System Keychain에
신뢰 루트로 등록합니다. 신뢰할 수 있는 로컬 Root CA 파일을 사용해 아래 명령을
실행합니다.

```bash
sudo security add-trusted-cert \
  -d \
  -r trustRoot \
  -k /Library/Keychains/System.keychain \
  /path/to/sarang-univ-local-root-ca.crt
```

등록 후 Node가 macOS 시스템 CA 저장소를 사용할 수 있는지 확인합니다.

```bash
node --use-system-ca -e "fetch('https://local.api.sarang-univ.com/api/v1/admin/retreats').then(r => console.log(r.status))"
```

인증서 검증이 정상이라면 인증 쿠키가 없는 상태에서 `401`이 출력됩니다. 이
응답은 TLS 검증을 통과해 API 서버까지 도달했다는 의미입니다.

admin 개발 서버는 `NODE_OPTIONS=--use-system-ca`로 실행합니다. 이 설정 덕분에
`local.admin.sarang-univ.com`의 server-side 요청이 System Keychain을 통해
`local.api.sarang-univ.com` 인증서를 검증할 수 있습니다.

`NODE_TLS_REJECT_UNAUTHORIZED=0`은 사용하지 않습니다. 이 값은 로컬 CA를
신뢰하는 방식이 아니라 TLS 검증 자체를 비활성화합니다.
