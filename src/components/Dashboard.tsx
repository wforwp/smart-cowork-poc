import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  AppBar, 
  Toolbar, 
  Container, 
  Card, 
  CardActionArea, 
  CardContent,
  IconButton,
  Avatar,
  Stack,
  Grid,
  Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SendIcon from '@mui/icons-material/Send';
import EventIcon from '@mui/icons-material/Event';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LogoutIcon from '@mui/icons-material/Logout';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import FolderIcon from '@mui/icons-material/Folder';
import { DataCollection } from './DataCollection';
import { WorkRequest, WorkCalendar } from './TaskComponents';
import { RequestManagement } from './RequestManagement';
import { DocumentManagement } from './DocumentManagement';

interface DashboardProps {
  user: { 
    employeeId: string; 
    name: string; 
    department: string; 
    team: string; 
    position: string; 
  } | null;
  onLogout: () => void;
}

type TaskType = 'collection' | 'request' | 'calendar' | 'agent' | 'request_manage' | 'doc_manage' | null;

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState<TaskType>(null);

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  if (!user) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h6">로그인이 필요합니다.</Typography>
        <Button onClick={() => navigate('/')}>로그인 페이지로 이동</Button>
      </Container>
    );
  }

  const tasks = [
    { 
      id: 'collection' as TaskType, 
      title: '자료취합', 
      desc: '자료 업로드 및 현황 파악', 
      icon: <AssignmentIcon sx={{ fontSize: 40, color: '#2563eb' }} /> 
    },
    { 
      id: 'request' as TaskType, 
      title: '업무신청', 
      desc: '업무 요청 및 승인 프로세스', 
      icon: <SendIcon sx={{ fontSize: 40, color: '#16a34a' }} /> 
    },
    { 
      id: 'calendar' as TaskType, 
      title: '업무 캘린더', 
      desc: '전체 및 개인 일정 관리', 
      icon: <EventIcon sx={{ fontSize: 40, color: '#ea580c' }} /> 
    },
    { 
      id: 'agent' as TaskType, 
      title: '에이전트', 
      desc: 'AI 기반 업무 보조 및 챗봇', 
      icon: <SmartToyIcon sx={{ fontSize: 40, color: '#7c3aed' }} /> 
    },
    { 
      id: 'request_manage' as TaskType, 
      title: '업무신청관리', 
      desc: '신청 내역 및 프로세스 설정', 
      icon: <SettingsSuggestIcon sx={{ fontSize: 40, color: '#0891b2' }} /> 
    },
    { 
      id: 'doc_manage' as TaskType, 
      title: '문서관리', 
      desc: '팀별/부서별 통합 문서함', 
      icon: <FolderIcon sx={{ fontSize: 40, color: '#be185d' }} /> 
    },
  ];

  const renderTaskDetail = () => {
    switch (selectedTask) {
      case 'collection': return <DataCollection currentUser={user} />;
      case 'request': return <WorkRequest user={user} />;
      case 'calendar': return <WorkCalendar />;
      case 'agent': return (
        <Paper sx={{ p: 3, borderRadius: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>🤖 에이전트</Typography>
          <Typography color="text.secondary">AI 에이전트 서비스 준비 중입니다.</Typography>
        </Paper>
      );
      case 'request_manage': return <RequestManagement />;
      case 'doc_manage': return <DocumentManagement currentUser={user} />;
      default: return null;
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', color: 'text.primary' }}>
        <Toolbar>
          {selectedTask && (
            <IconButton 
              edge="start" 
              color="inherit" 
              onClick={() => setSelectedTask(null)} 
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700, color: 'primary.main' }}>
            Smart Cowork
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {user.name} {user.position}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user.team} | {user.employeeId}
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32, fontSize: '0.875rem' }}>
              {user.name[0]}
            </Avatar>
            <IconButton color="inherit" onClick={handleLogout} size="small">
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, pb: 4 }}>
        {!selectedTask ? (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.02em' }}>
                안녕하세요, {user.name}님 👋
              </Typography>
              <Typography variant="body1" color="text.secondary">
                오늘 진행하실 업무를 선택해 주세요.
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {tasks.map((task) => (
                <Grid size={{ xs: 12, sm: 4 }} key={task.id}>
                  <Card 
                    sx={{ 
                      borderRadius: 4, 
                      height: '100%',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': { 
                        transform: 'translateY(-8px)',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
                      }
                    }}
                  >
                    <CardActionArea 
                      onClick={() => setSelectedTask(task.id)}
                      sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: '16px', 
                        bgcolor: 'primary.50', 
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {task.icon}
                      </Box>
                      <CardContent sx={{ textAlign: 'center', p: 0 }}>
                        <Typography gutterBottom variant="h6" component="div" sx={{ fontWeight: 700 }}>
                          {task.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {task.desc}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        ) : (
          <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
              {tasks.find(t => t.id === selectedTask)?.title}
            </Typography>
            {renderTaskDetail()}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Dashboard;
