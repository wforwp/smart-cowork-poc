import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Container,
  Alert,
  InputAdornment
} from '@mui/material';
import Papa from 'papaparse';
import { useNavigate } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';

interface LoginProps {
  onLogin: (user: { 
    employeeId: string; 
    name: string; 
    department: string; 
    team: string; 
    position: string; 
  }) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!employeeId || !password) {
      setError('사번과 비밀번호를 모두 입력해주세요.');
      return;
    }

    Papa.parse('/users.csv', {
      download: true,
      header: true,
      complete: (results) => {
        const users = results.data as any[];
        const user = users.find(
          (u) => u.employeeId === employeeId && u.password === password
        );

        if (user) {
          onLogin({ 
            employeeId: user.employeeId, 
            name: user.name,
            department: user.department,
            team: user.team,
            position: user.position
          });
          navigate('/dashboard');
        } else {
          setError('사번 또는 비밀번호가 일치하지 않습니다.');
        }
      },
      error: (err) => {
        console.error('CSV Load Error:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      }
    });
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: '#f8fafc',
        px: 2
      }}
    >
      <Container maxWidth="xs" sx={{ p: 0 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center' 
          }}
        >
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>
              Smart Cowork
            </Typography>
            <Typography variant="body2" color="text.secondary">
              협업을 위한 스마트한 업무 관리 시스템
            </Typography>
          </Box>

          <Paper 
            elevation={0} 
            sx={{ 
              p: { xs: 3, sm: 4 }, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              width: '100%',
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
            }}
          >
            <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
              로그인
            </Typography>
            
            {error && <Alert severity="error" sx={{ width: '100%', mb: 2, borderRadius: 2 }}>{error}</Alert>}
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="employeeId"
              label="사번"
              name="employeeId"
              autoComplete="username"
              autoFocus
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="비밀번호"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              type="button"
              fullWidth
              variant="contained"
              size="large"
              sx={{ 
                mt: 4, 
                mb: 2, 
                py: 1.5,
                borderRadius: 2,
                fontSize: '1rem',
                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.4)'
              }}
              onClick={handleLogin}
            >
              로그인하기
            </Button>
          </Paper>
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 4 }}>
            © 2026 Smart Cowork Team. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
