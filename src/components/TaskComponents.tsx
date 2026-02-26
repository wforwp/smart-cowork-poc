import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  MenuItem, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Grid,
  Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import Papa from 'papaparse';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarCustom.css';

// Supabase Import
import { supabase } from '../supabase';

interface User {
  employeeId: string;
  name: string;
  department: string;
  team: string;
  position: string;
}

interface TemplateItem {
  id: string;
  name: string;
  dataType: 'text' | 'number' | 'date' | 'select';
}

interface WorkTemplate {
  id: string;
  title: string;
  items: TemplateItem[];
  default_processor_id?: string;
}

interface Request {
  id: string;
  template_id: string;
  template_title: string;
  title: string;
  requester_id: string;
  requester_name: string;
  requester_position: string;
  requester_team: string;
  processor_id: string;
  processor_name: string;
  processor_position: string;
  processor_team: string;
  employees: (User & { values: Record<string, string> })[];
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

// AI 분석 데이터 인터페이스
interface AnalyzedTask {
  id: string;
  task_name: string;
  start_date: string;
  end_date: string;
  related_system: string;
  is_processed: boolean;
  created_at: string;
}

interface WorkRequestProps {
  user: User;
}

export const WorkRequest: React.FC<WorkRequestProps> = ({ user }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<WorkTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const [title, setTitle] = useState('');
  const [processorId, setProcessorId] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<(User & { values: Record<string, string> })[]>([]);
  
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [tempSelected, setTempSelected] = useState<string[]>([]);

  const loadInitialData = async () => {
    try {
      Papa.parse('/users.csv', {
        download: true, header: true,
        complete: (results) => setUsers(results.data as User[])
      });
      const { data: tData } = await supabase.from('work_templates').select('*');
      if (tData) setTemplates(tData);
      await loadRequests();
    } catch (e) {
      console.error(e);
    }
  };

  const loadRequests = async () => {
    const { data, error } = await supabase
      .from('work_app_requests')
      .select('*')
      .or(`requester_id.eq.${user.employeeId},processor_id.eq.${user.employeeId}`)
      .order('created_at', { ascending: false });
    
    if (!error && data) setRequests(data);
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId) || null;
    setSelectedTemplate(template);
    if (template && template.default_processor_id) {
      setProcessorId(template.default_processor_id);
    } else {
      setProcessorId('');
    }
    setSelectedEmployees(prev => prev.map(emp => ({ ...emp, values: {} })));
  };

  const handleSubmit = async () => {
    if (!selectedTemplate || !title || !processorId) {
      setSnackbar({ open: true, message: '모든 필수 정보를 입력해주세요.', severity: 'error' });
      return;
    }
    const processor = users.find(u => u.employeeId === processorId);
    try {
      const { error } = await supabase.from('work_app_requests').insert([{
        template_id: selectedTemplate.id,
        template_title: selectedTemplate.title,
        title,
        requester_id: user.employeeId,
        requester_name: user.name,
        requester_position: user.position,
        requester_team: user.team,
        processor_id: processorId,
        processor_name: processor?.name || '',
        processor_position: processor?.position || '',
        processor_team: processor?.team || '',
        employees: selectedEmployees,
        status: 'pending'
      }]);
      if (error) throw error;
      setTitle('');
      setProcessorId('');
      setSelectedEmployees([]);
      setSelectedTemplate(null);
      setIsCreating(false);
      setSnackbar({ open: true, message: '업무 신청이 완료되었습니다.', severity: 'success' });
      loadRequests();
    } catch (e: any) {
      alert('저장 실패: ' + e.message);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase.from('work_app_requests').update({ status: 'approved' }).eq('id', id);
      if (error) throw error;
      setSnackbar({ open: true, message: '승인되었습니다.', severity: 'success' });
      loadRequests();
    } catch (e: any) {
      alert('처리 실패: ' + e.message);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!window.confirm('정말 이 신청 내역을 삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase.from('work_app_requests').delete().eq('id', id);
      if (error) throw error;
      setSnackbar({ open: true, message: '삭제되었습니다.', severity: 'success' });
      loadRequests();
    } catch (e: any) {
      alert('삭제 실패: ' + e.message);
    }
  };

  const downloadExcel = (req: Request) => {
    const template = templates.find(t => t.id === req.template_id);
    const data = req.employees.map(emp => {
      const row: any = { '성명': emp.name, '사번': emp.employeeId, '부서': emp.department, '팀': emp.team };
      template?.items.forEach(item => { row[item.name] = emp.values[item.id] || ''; });
      return row;
    });
    const csv = Papa.unparse(data);
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${req.template_title}_결과.csv`);
    link.click();
  };

  if (isCreating) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => setIsCreating(false)}><ArrowBackIcon /></IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>신규 업무 신청</Typography>
        </Box>
        <Paper sx={{ p: 3, borderRadius: 4 }}>
          <Grid container spacing={3}>
            <Grid size={12}>
              <TextField select fullWidth label="업무 선택" value={selectedTemplate?.id || ''} onChange={(e) => handleTemplateChange(e.target.value)} required>
                {templates.map(t => <MenuItem key={t.id} value={t.id}>{t.title}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={12}><TextField fullWidth label="신청자" value={`${user.name} ${user.position}`} disabled variant="filled" /></Grid>
            <Grid size={12}>
              <TextField select fullWidth label="처리자 선택" value={processorId} onChange={(e) => setProcessorId(e.target.value)} required>
                {users.filter(u => u.employeeId !== user.employeeId).map((u) => (
                  <MenuItem key={u.employeeId} value={u.employeeId}>{u.name} {u.position} ({u.team})</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={12}><TextField fullWidth label="제목" value={title} onChange={(e) => setTitle(e.target.value)} required /></Grid>
            <Grid size={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}><Button variant="outlined" startIcon={<SearchIcon />} onClick={() => { setTempSelected(selectedEmployees.map(e => e.employeeId)); setIsSearchOpen(true); }} disabled={!selectedTemplate}>직원 추가</Button></Box>
              <TableContainer sx={{ border: '1px solid #eee', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead><TableRow><TableCell>직원</TableCell>{selectedTemplate?.items.map(i => <TableCell key={i.id}>{i.name}</TableCell>)}<TableCell align="right">삭제</TableCell></TableRow></TableHead>
                  <TableBody>
                    {selectedEmployees.map(emp => (
                      <TableRow key={emp.employeeId}>
                        <TableCell><Typography variant="body2">{emp.name}</Typography></TableCell>
                        {selectedTemplate?.items.map(item => (
                          <TableCell key={item.id}>
                            <TextField size="small" fullWidth type={item.dataType === 'number' ? 'number' : item.dataType === 'date' ? 'date' : 'text'} value={emp.values[item.id] || ''} onChange={(e) => setSelectedEmployees(prev => prev.map(p => p.employeeId === emp.employeeId ? { ...p, values: { ...p.values, [item.id]: e.target.value } } : p))} />
                          </TableCell>
                        ))}
                        <TableCell align="right"><IconButton size="small" color="error" onClick={() => setSelectedEmployees(selectedEmployees.filter(e => e.employeeId !== emp.employeeId))}><DeleteIcon fontSize="small" /></IconButton></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid size={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button onClick={() => setIsCreating(false)}>취소</Button>
              <Button variant="contained" onClick={handleSubmit}>신청하기</Button>
            </Grid>
          </Grid>
        </Paper>
        <Dialog open={isSearchOpen} onClose={() => setIsSearchOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>직원 선택</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ mb: 2 }}>
              <TextField 
                fullWidth 
                placeholder="이름 또는 사번 검색" 
                value={searchKeyword} 
                onChange={(e) => setSearchKeyword(e.target.value)} 
              />
            </Box>
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table stickyHeader size="small">
                <TableBody>
                  {users.filter(u => (u.name || '').toLowerCase().includes(searchKeyword.toLowerCase())).map(u => (
                    <TableRow 
                      key={u.employeeId} 
                      hover 
                      onClick={() => setTempSelected(prev => prev.includes(u.employeeId) ? prev.filter(i => i !== u.employeeId) : [...prev, u.employeeId])} 
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox checked={tempSelected.includes(u.employeeId)} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{u.name} {u.position}</Typography>
                        <Typography variant="caption" color="text.secondary">{u.team}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsSearchOpen(false)}>취소</Button>
            <Button variant="contained" onClick={() => { 
              const selected = users.filter(u => tempSelected.includes(u.employeeId)).map(u => ({
                ...u,
                values: selectedEmployees.find(e => e.employeeId === u.employeeId)?.values || {}
              }));
              setSelectedEmployees(selected); 
              setIsSearchOpen(false); 
            }}>확인</Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>업무 신청 내역</Typography>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={loadRequests} size="small"><RefreshIcon fontSize="small" /></IconButton>
          <Button variant="contained" onClick={() => setIsCreating(true)}>신규 신청</Button>
        </Stack>
      </Box>
      <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}><TableRow><TableCell>구분</TableCell><TableCell>제목</TableCell><TableCell>신청/처리자</TableCell><TableCell>상태</TableCell><TableCell align="right">작업</TableCell></TableRow></TableHead>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 8 }}>내역이 없습니다.</TableCell></TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow key={req.id} hover onDoubleClick={() => { setSelectedRequest(req); setIsDetailOpen(true); }} sx={{ cursor: 'pointer' }}>
                    <TableCell><Chip label={req.template_title} size="small" variant="outlined" /></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{req.title}</Typography><Typography variant="caption" color="text.secondary">{new Date(req.created_at).toLocaleString()}</Typography></TableCell>
                    <TableCell><Typography variant="caption" sx={{ display: 'block' }}>신청: {req.requester_name}</Typography><Typography variant="caption" sx={{ display: 'block' }}>처리: {req.processor_name}</Typography></TableCell>
                    <TableCell><Chip label={req.status === 'pending' ? '대기' : '승인'} color={req.status === 'pending' ? 'warning' : 'success'} size="small" /></TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        {req.processor_id === user.employeeId && req.status === 'pending' && (
                          <Button variant="contained" size="small" color="success" onClick={(e) => { e.stopPropagation(); handleApprove(req.id); }}>승인</Button>
                        )}
                        {req.requester_id === user.employeeId && (
                          <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDeleteRequest(req.id); }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={isDetailOpen} onClose={() => setIsDetailOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
            [{selectedRequest?.template_title}] {selectedRequest?.title}
          </Typography>
          <Stack direction="row" spacing={1}>
            {selectedRequest && <Button startIcon={<DownloadIcon />} variant="outlined" size="small" onClick={() => downloadExcel(selectedRequest)}>엑셀 다운로드</Button>}
            <IconButton onClick={() => setIsDetailOpen(false)}><CloseIcon /></IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <TableContainer><Table size="small">
            <TableHead sx={{ bgcolor: 'grey.50' }}><TableRow><TableCell>직원</TableCell><TableCell>사번</TableCell>
              {templates.find(t => t.id === selectedRequest?.template_id)?.items.map(i => <TableCell key={i.id}>{i.name}</TableCell>)}
            </TableRow></TableHead>
            <TableBody>
              {selectedRequest?.employees.map(emp => (
                <TableRow key={emp.employeeId}><TableCell>{emp.name}</TableCell><TableCell>{emp.employeeId}</TableCell>
                  {templates.find(t => t.id === selectedRequest?.template_id)?.items.map(i => <TableCell key={i.id}>{emp.values[i.id] || '-'}</TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table></TableContainer>
        </DialogContent>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}><Alert severity={snackbar.severity}>{snackbar.message}</Alert></Snackbar>
    </Box>
  );
};

export const WorkCalendar = () => {
  const [value, setValue] = useState<any>(new Date());
  const [tasks, setTasks] = useState<AnalyzedTask[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_analyzed_tasks')
        .select('*')
        .order('start_date', { ascending: true });
      if (error) throw error;
      if (data) setTasks(data);
    } catch (e) {
      console.error('업무 로드 실패:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleToggleProcess = async (task: AnalyzedTask) => {
    try {
      const { error } = await supabase
        .from('ai_analyzed_tasks')
        .update({ is_processed: !task.is_processed })
        .eq('id', task.id);
      if (error) throw error;
      loadTasks();
    } catch (e: any) {
      alert('상태 업데이트 실패: ' + e.message);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (!task.start_date || !task.end_date || !task.is_processed) return false;
    const start = new Date(task.start_date);
    const end = new Date(task.end_date);
    const selected = value instanceof Date ? value : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);
    return selected >= start && selected <= end;
  });

  const tileContent = ({ date, view }: any) => {
    if (view === 'month') {
      const dayTasks = tasks.filter(task => {
        if (!task.is_processed) return false;
        const start = new Date(task.start_date);
        const end = new Date(task.end_date);
        const current = new Date(date);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        current.setHours(0, 0, 0, 0);
        return current >= start && current <= end;
      });
      
      if (dayTasks.length > 0) {
        return (
          <Box className="calendar-tasks-container">
            {dayTasks.map(task => (
              <Box key={task.id} className="calendar-task-item">
                {task.task_name}
              </Box>
            ))}
          </Box>
        );
      }
    }
    return null;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <CalendarMonthIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>업무 진행 캘린더 (AI 분석)</Typography>
        <Chip 
          icon={<TipsAndUpdatesIcon sx={{ fontSize: '1rem !important' }} />} 
          label="AI가 분석한 업무 일정을 달력에서 바로 확인하세요" 
          size="small" 
          color="secondary" 
          variant="outlined" 
          sx={{ ml: 2 }}
        />
      </Stack>

      {/* 상단: 캘린더 영역 (전체 너비 활용) */}
      <Paper sx={{ p: 2, borderRadius: 4 }}>
        <Calendar 
          onChange={setValue} 
          value={value} 
          tileContent={tileContent}
          formatDay={(_locale, date) => date.getDate().toString()}
          calendarType="gregory"
        />
      </Paper>

      {/* 하단: 리스트 영역 */}
      <Paper sx={{ p: 3, borderRadius: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {value instanceof Date ? value.toLocaleDateString() : ''} 시행/진행 업무
          </Typography>
          <Button size="small" onClick={loadTasks} startIcon={<RefreshIcon fontSize="small" />}>목록 갱신</Button>
        </Stack>
        
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={3}>
          {/* 적용된 업무 리스트 */}
          <Grid size={12}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 700 }}>업무명 / 시스템</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>기간</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>상태</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasks.length === 0 ? (
                    <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4 }}>데이터가 없습니다.</TableCell></TableRow>
                  ) : (
                    tasks.map((task) => (
                      <TableRow key={task.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{task.task_name}</Typography>
                          <Typography variant="caption" color="text.secondary">{task.related_system}</Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{task.start_date} ~ {task.end_date}</TableCell>
                        <TableCell align="right">
                          <Button 
                            variant={task.is_processed ? "contained" : "outlined"} 
                            size="small" 
                            color={task.is_processed ? "success" : "primary"}
                            onClick={() => handleToggleProcess(task)}
                            startIcon={task.is_processed ? <CheckCircleIcon /> : <AddCircleOutlineIcon />}
                            sx={{ borderRadius: 2, fontSize: '0.7rem' }}
                          >
                            {task.is_processed ? '적용됨' : '달력적용'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};
