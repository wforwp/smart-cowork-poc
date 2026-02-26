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
  Divider,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Grid
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import Papa from 'papaparse';

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
}

interface Request {
  id: string;
  templateId: string;
  templateTitle: string;
  title: string;
  requesterId: string;
  requesterName: string;
  requesterPosition: string;
  requesterTeam: string;
  processorId: string;
  processorName: string;
  processorPosition: string;
  processorTeam: string;
  employees: (User & { values: Record<string, string> })[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
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
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [tempSelected, setTempSelected] = useState<string[]>([]);

  useEffect(() => {
    Papa.parse('/users.csv', {
      download: true,
      header: true,
      complete: (results) => {
        setUsers(results.data as User[]);
      }
    });

    const savedRequests = localStorage.getItem('work_requests');
    if (savedRequests) setRequests(JSON.parse(savedRequests));

    const savedTemplates = localStorage.getItem('work_templates');
    if (savedTemplates) setTemplates(JSON.parse(savedTemplates));
  }, []);

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId) || null;
    setSelectedTemplate(template);
    // 템플릿 변경 시 기존 직원들의 입력값 초기화
    setSelectedEmployees(prev => prev.map(emp => ({ ...emp, values: {} })));
  };

  const handleOpenSearch = () => {
    setTempSelected(selectedEmployees.map(e => e.employeeId));
    setSearchKeyword('');
    setIsSearchOpen(true);
  };

  const handleConfirmSearch = () => {
    const selected = users
      .filter(u => tempSelected.includes(u.employeeId))
      .map(u => {
        const existing = selectedEmployees.find(e => e.employeeId === u.employeeId);
        return existing || { ...u, values: {} };
      });
    setSelectedEmployees(selected);
    setIsSearchOpen(false);
  };

  const handleValueChange = (empId: string, itemId: string, value: string) => {
    setSelectedEmployees(prev => prev.map(emp => 
      emp.employeeId === empId 
        ? { ...emp, values: { ...emp.values, [itemId]: value } }
        : emp
    ));
  };

  const handleSubmit = () => {
    if (!selectedTemplate || !title || !processorId) {
      setSnackbar({ open: true, message: '업무 선택, 제목, 처리자를 모두 입력해주세요.', severity: 'error' });
      return;
    }

    const processor = users.find(u => u.employeeId === processorId);
    const newRequest: Request = {
      id: Date.now().toString(),
      templateId: selectedTemplate.id,
      templateTitle: selectedTemplate.title,
      title,
      requesterId: user.employeeId,
      requesterName: user.name,
      requesterPosition: user.position,
      requesterTeam: user.team,
      processorId,
      processorName: processor?.name || '',
      processorPosition: processor?.position || '',
      processorTeam: processor?.team || '',
      employees: selectedEmployees,
      status: 'pending',
      createdAt: new Date().toLocaleString(),
    };

    const updatedRequests = [...requests, newRequest];
    setRequests(updatedRequests);
    localStorage.setItem('work_requests', JSON.stringify(updatedRequests));

    setTitle('');
    setProcessorId('');
    setSelectedEmployees([]);
    setSelectedTemplate(null);
    setIsCreating(false);
    setSnackbar({ open: true, message: '업무 신청이 완료되었습니다.', severity: 'success' });
  };

  const handleApprove = (id: string) => {
    const updated = requests.map(req => 
      req.id === id ? { ...req, status: 'approved' as const } : req
    );
    setRequests(updated);
    localStorage.setItem('work_requests', JSON.stringify(updated));
    setSnackbar({ open: true, message: '승인되었습니다.', severity: 'success' });
  };

  const myRequests = requests.filter(r => r.requesterId === user.employeeId);
  const tasksToProcess = requests.filter(r => r.processorId === user.employeeId);

  const filteredUsers = users.filter(u => {
    if (!u || !u.employeeId) return false;
    const kw = searchKeyword.toLowerCase();
    return (u.name || '').toLowerCase().includes(kw) || (u.employeeId || '').toLowerCase().includes(kw);
  });

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
              <TextField
                select
                fullWidth
                label="업무 선택 (구분)"
                value={selectedTemplate?.id || ''}
                onChange={(e) => handleTemplateChange(e.target.value)}
                required
                helperText="신청할 업무의 종류를 먼저 선택하세요."
              >
                {templates.map(t => <MenuItem key={t.id} value={t.id}>{t.title}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="신청자" value={`${user.name} ${user.position} (${user.team})`} disabled variant="filled" />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth select label="처리자 선택" value={processorId}
                onChange={(e) => setProcessorId(e.target.value)} required
              >
                {users.filter(u => u.employeeId !== user.employeeId).map((u) => (
                  <MenuItem key={u.employeeId} value={u.employeeId}>
                    <Box><Typography variant="body1">{u.name} {u.position}</Typography><Typography variant="caption" color="text.secondary">{u.department} / {u.team}</Typography></Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="업무 제목" placeholder="업무 내용을 요약해서 입력하세요." value={title} onChange={(e) => setTitle(e.target.value)} required />
            </Grid>
            
            <Grid size={12}>
              <Divider sx={{ my: 1 }}><Typography variant="body2" color="text.secondary">관련 직원 및 항목 입력</Typography></Divider>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, mt: 1 }}>
                <Button variant="outlined" startIcon={<SearchIcon />} onClick={handleOpenSearch} disabled={!selectedTemplate}>직원 추가</Button>
              </Box>

              <TableContainer component={Box} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>성명/팀</TableCell>
                      {selectedTemplate?.items.map(item => (
                        <TableCell key={item.id} sx={{ fontWeight: 600, minWidth: 150 }}>{item.name}</TableCell>
                      ))}
                      <TableCell align="right" sx={{ fontWeight: 600 }}>작업</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedEmployees.length === 0 ? (
                      <TableRow><TableCell colSpan={(selectedTemplate?.items.length || 0) + 2} align="center" sx={{ py: 3, color: 'text.secondary' }}>{!selectedTemplate ? '업무를 먼저 선택해주세요.' : '추가된 직원이 없습니다.'}</TableCell></TableRow>
                    ) : (
                      selectedEmployees.map((emp) => (
                        <TableRow key={emp.employeeId}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{emp.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{emp.team}</Typography>
                          </TableCell>
                          {selectedTemplate?.items.map(item => (
                            <TableCell key={item.id}>
                              {item.dataType === 'select' ? (
                                <TextField select size="small" fullWidth value={emp.values[item.id] || ''} onChange={(e) => handleValueChange(emp.employeeId, item.id, e.target.value)}>
                                  <MenuItem value="예">예</MenuItem>
                                  <MenuItem value="아니오">아니오</MenuItem>
                                </TextField>
                              ) : (
                                <TextField
                                  size="small" fullWidth
                                  type={item.dataType === 'number' ? 'number' : item.dataType === 'date' ? 'date' : 'text'}
                                  value={emp.values[item.id] || ''}
                                  onChange={(e) => handleValueChange(emp.employeeId, item.id, e.target.value)}
                                  InputLabelProps={item.dataType === 'date' ? { shrink: true } : undefined}
                                />
                              )}
                            </TableCell>
                          ))}
                          <TableCell align="right">
                            <IconButton size="small" color="error" onClick={() => setSelectedEmployees(selectedEmployees.filter(e => e.employeeId !== emp.employeeId))}><DeleteIcon fontSize="small" /></IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            <Grid size={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button onClick={() => setIsCreating(false)}>취소</Button>
              <Button variant="contained" size="large" startIcon={<SendIcon />} onClick={handleSubmit} sx={{ px: 4, py: 1.2, borderRadius: 2 }}>업무 신청하기</Button>
            </Grid>
          </Grid>
        </Paper>

        <Dialog open={isSearchOpen} onClose={() => setIsSearchOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ fontWeight: 700 }}>직원 선택</DialogTitle>
          <DialogContent dividers>
            <TextField fullWidth placeholder="이름 또는 사번 검색" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} sx={{ mb: 2 }} />
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.employeeId} hover onClick={() => setTempSelected(prev => prev.includes(u.employeeId) ? prev.filter(i => i !== u.employeeId) : [...prev, u.employeeId])} sx={{ cursor: 'pointer' }}>
                      <TableCell padding="checkbox"><Checkbox checked={tempSelected.includes(u.employeeId)} /></TableCell>
                      <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{u.name} {u.position}</Typography><Typography variant="caption" color="text.secondary">{u.team}</Typography></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions><Button onClick={() => setIsSearchOpen(false)}>취소</Button><Button variant="contained" onClick={handleConfirmSearch}>확인</Button></DialogActions>
        </Dialog>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}><ListAltIcon color="primary" /> 업무 신청 관리</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsCreating(true)} sx={{ borderRadius: 2 }}>신규 업무 신청</Button>
      </Box>

      {/* 목록 화면 */}
      <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>구분</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>제목</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>신청/처리자</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>상태</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...tasksToProcess, ...myRequests].length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 8 }}>내역이 없습니다.</TableCell></TableRow>
              ) : (
                requests.filter(r => r.requesterId === user.employeeId || r.processorId === user.employeeId).slice().reverse().map((req) => (
                  <TableRow key={req.id} hover>
                    <TableCell><Chip label={req.templateTitle} size="small" color="primary" variant="outlined" /></TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{req.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{req.createdAt}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ display: 'block' }}>신청: {req.requesterName}</Typography>
                      <Typography variant="caption" sx={{ display: 'block' }}>처리: {req.processorName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={req.status === 'pending' ? '대기' : req.status === 'approved' ? '승인' : '반려'} color={req.status === 'pending' ? 'warning' : req.status === 'approved' ? 'success' : 'error'} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      {req.processorId === user.employeeId && req.status === 'pending' && (
                        <Button variant="contained" size="small" color="success" onClick={() => handleApprove(req.id)}>승인</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export const WorkCalendar = () => (
  <Paper sx={{ p: 3, mt: 2, borderRadius: 4 }}>
    <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>📅 업무 캘린더</Typography>
    <Typography color="text.secondary">전체 업무 일정 및 개인별 일정을 캘린더 형태로 확인합니다.</Typography>
  </Paper>
);
