@echo off
chcp 65001 > nul
title Cloudflare Pages 애플리케이션 자동 생성 및 배포
cd /d "%~dp0"
echo ================================================================
echo  ☁️ Cloudflare에 korean-quiz-game 애플리케이션을 생성 및 배포합니다.
echo  브라우저가 열리면 [Allow(허용)] 버튼을 눌러주세요!
echo ================================================================
call npx wrangler login
call npx wrangler pages project create korean-quiz-game --production-branch=main
call npx wrangler pages deploy ./public --project-name=korean-quiz-game --branch=main
echo ================================================================
echo  ✅ 배포가 완료되었습니다! 위 표시된 .pages.dev 주소로 접속하세요.
echo ================================================================
pause
