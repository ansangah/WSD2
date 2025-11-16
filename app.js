const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

// 1) 로깅 미들웨어 (직접 구현)
app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.originalUrl}`);
  next();
});

// 2) 공통 응답 헬퍼 미들웨어
app.use((req, res, next) => {
  res.success = (data = null, message = 'OK', statusCode = 200) => {
    return res.status(statusCode).json({
      status: 'success',
      message,
      data,
    });
  };

  res.fail = (message = 'Bad Request', statusCode = 400, data = null) => {
    return res.status(statusCode).json({
      status: 'error',
      message,
      data,
    });
  };

  next();
});

// 3) 메모리 데이터베이스 (users)
let users = [];
let nextUserId = 1;

// 라우트들
// [POST 1] 새 유저 생성
app.post('/users', (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.fail('name과 email은 필수입니다.', 400);
  }

  const newUser = {
    id: nextUserId++,
    name,
    email,
    active: true,
  };

  users.push(newUser);

  return res.success(newUser, '유저가 생성되었습니다.', 201);
});

// [POST 2] 유저 비활성화
app.post('/users/:id/deactivate', (req, res) => {
  const id = Number(req.params.id);
  const user = users.find((u) => u.id === id);

  if (!user) {
    return res.fail('해당 유저를 찾을 수 없습니다.', 404);
  }

  user.active = false;
  return res.success(user, '유저가 비활성화되었습니다.', 200);
});

// [GET 1] 전체 유저 목록
app.get('/users', (req, res) => {
  return res.success(users, '유저 목록 조회 성공', 200);
});

// [GET 2] 특정 유저 조회
app.get('/users/:id', (req, res) => {
  const id = Number(req.params.id);
  const user = users.find((u) => u.id === id);

  if (!user) {
    return res.fail('해당 유저를 찾을 수 없습니다.', 404);
  }

  return res.success(user, '유저 조회 성공', 200);
});

// [PUT 1] 유저 기본 정보 수정
app.put('/users/:id', (req, res) => {
  const id = Number(req.params.id);
  const { name, email } = req.body;

  if (!name && !email) {
    return res.fail('수정할 name 또는 email 중 최소 하나는 있어야 합니다.', 400);
  }

  const user = users.find((u) => u.id === id);

  if (!user) {
    return res.fail('해당 유저를 찾을 수 없습니다.', 404);
  }

  if (name) user.name = name;
  if (email) user.email = email;

  return res.success(user, '유저 정보가 수정되었습니다.', 200);
});

// [PUT 2] 유저 비밀번호 변경 (형식 검증 예시)
app.put('/users/:id/password', (req, res) => {
  const id = Number(req.params.id);
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.fail('비밀번호는 최소 6자 이상이어야 합니다.', 400);
  }

  const user = users.find((u) => u.id === id);

  if (!user) {
    return res.fail('해당 유저를 찾을 수 없습니다.', 404);
  }

  // 실제로는 암호화해야 하지만, 과제라 단순히 필드만 추가
  user.password = password;

  return res.success(null, '비밀번호 변경 완료', 200);
});

// [DELETE 1] 특정 유저 삭제
app.delete('/users/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = users.findIndex((u) => u.id === id);

  if (index === -1) {
    return res.fail('해당 유저를 찾을 수 없습니다.', 404);
  }

  users.splice(index, 1);

  // 204: No Content → data 없이 응답
  return res.status(204).send();
});

// [DELETE 2] 모든 유저 삭제
app.delete('/users', (req, res) => {
  users = [];
  nextUserId = 1;

  return res.success(null, '모든 유저가 삭제되었습니다.', 200);
});



// 4) 에러 강제 발생 테스트 라우트 (5xx 용)
app.get('/force-error', (req, res, next) => {
  // 일부러 에러 발생
  next(new Error('Intentional server error'));
});

// 503 전용
app.get('/maintenance', (req, res) => {
  return res.status(503).json({
    status: 'error',
    message: 'Service temporarily unavailable (maintenance).',
    data: null,
  });
});

// 5) 404 처리 미들웨어
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: 'Not Found',
    data: null,
  });
});

// 6) 공통 에러 핸들러 미들웨어
app.use((err, req, res, next) => {
  console.error('💥 Server Error:', err.message);

  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
    data: null,
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});