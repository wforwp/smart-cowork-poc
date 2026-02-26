import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, MenuItem, Chip,
  IconButton, Divider, Stack, Alert, FormControl, InputLabel,
  Select, OutlinedInput, Checkbox, ListItemText, FormControlLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import Papa from 'papaparse';

// Supabase Import
import { supabase } from '../supabase';

// --- Interfaces ---
interface RequestItem {
  id: string;
  name: string;
  dataType: 'text' | 'number' | 'date';
}

interface DataRequest {
  id: string; 
  requestNo: string;
  title: string;
  requesterId: string;
  requesterName: string;
  targetIds: string[];
  items: RequestItem[];
  createdAt: string; 
}

interface DataResponse {
  id: string;
  requestId: string;
  targetId: string;
  targetName: string;
  values: Record<string, string>;
  submittedAt: string; 
  is_na: boolean; // 해당없음 여부
}

interface User {
  employeeId: string;
  name: string;
  department: string;
  team: string;
  position: string;
}

export const DataCollection: React.FC<{ currentUser: { employeeId: string; name: string } }> = ({ currentUser }) => {
  const [requests, setRequests] = useState<DataRequest[]>([]);
  const [responses, setResponses] = useState<DataResponse[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [dbStatus, setDbStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailOpen] = useState(false);
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DataRequest | null>(null);

  // 삭제 확인용 모달 상태
  const [isDeleteDialogOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newTargetIds, setNewTargetIds] = useState<string[]>([]);
  const [newItems, setNewItems] = useState<RequestItem[]>([{ id: '1', name: '', dataType: 'text' }]);
  
  // 입력 필드 상태
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [isNA, setIsNA] = useState(false); // 해당없음 체크 상태

  // 필터 상태
  const [excludeNA, setExcludeNA] = useState(false); // 해당없음 제외 필터

  const checkConnection = async () => {
    try {
      setDbStatus('checking');
      const { error } = await supabase.from('requests').select('id').limit(1);
      if (error) throw error;
      setDbStatus('online');
    } catch (e: any) {
      setDbStatus('offline');
      setErrorMsg(`DB 연결 실패: ${e.message}`);
    }
  };

  const loadRequests = async () => {
    const { data, error } = await supabase.from('requests').select('*').order('createdAt', { ascending: false });
    if (!error && data) setRequests(data);
  };

  const loadResponses = async () => {
    const { data, error } = await supabase.from('responses').select('*').order('submittedAt', { ascending: false });
    if (!error && data) setResponses(data);
  };

  useEffect(() => {
    checkConnection();
    loadRequests();
    loadResponses();

    Papa.parse('/users.csv', {
      download: true, header: true,
      complete: (results) => setUsers(results.data as User[])
    });

    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => loadRequests())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'responses' }, () => loadResponses())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleCreateRequest = async () => {
    if (!newTitle || newTargetIds.length === 0) return alert("제목과 대상자를 입력하세요.");
    try {
      setIsRequestModalOpen(false);
      const requestNo = `REQ-${new Date().getTime().toString().slice(-6)}`;
      const { error } = await supabase.from('requests').insert([{
        requestNo,
        title: newTitle,
        requesterId: currentUser.employeeId,
        requesterName: currentUser.name,
        targetIds: newTargetIds,
        items: newItems,
        createdAt: new Date().toISOString()
      }]);
      if (error) throw error;
      setNewTitle('');
      setNewTargetIds([]);
      setNewItems([{ id: '1', name: '', dataType: 'text' }]);
    } catch (e: any) {
      alert(`저장 실패: ${e.message}`);
      setIsRequestModalOpen(true);
    }
  };

  const openDeleteConfirm = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    setItemToDelete(docId);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleteModalOpen(false);
      await supabase.from('responses').delete().eq('requestId', itemToDelete);
      const { error } = await supabase.from('requests').delete().eq('id', itemToDelete);
      if (error) throw error;
      alert("성공적으로 삭제되었습니다.");
      setItemToDelete(null);
      loadRequests();
    } catch (e: any) {
      alert(`삭제 실패: ${e.message}`);
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedRequest) return;
    try {
      setIsInputModalOpen(false);
      const { error } = await supabase.from('responses').insert([{
        requestId: selectedRequest.id,
        targetId: currentUser.employeeId,
        targetName: currentUser.name,
        values: isNA ? {} : inputValues,
        is_na: isNA,
        submittedAt: new Date().toISOString()
      }]);
      if (error) throw error;
      setInputValues({});
      setIsNA(false);
      alert("제출되었습니다.");
      loadResponses();
    } catch (e: any) {
      alert("제출 실패: " + e.message);
    }
  };

  const getFilteredResponses = (requestId: string) => {
    let res = responses.filter(r => r.requestId === requestId);
    if (excludeNA) {
      res = res.filter(r => !r.is_na);
    }
    return res;
  };

  const downloadExcel = (request: DataRequest) => {
    const dataToExport = getFilteredResponses(request.id);
    const data = dataToExport.map(res => {
      const row: any = { '제출자': res.targetName, '제출시간': res.submittedAt, '상태': res.is_na ? '해당없음' : '제출' };
      request.items.forEach(item => { 
        row[item.name] = res.is_na ? '-' : (res.values[item.id] || ''); 
      });
      return row;
    });
    const csv = Papa.unparse(data);
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${request.title}_결과${excludeNA ? '_필터' : ''}.csv`);
    link.click();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>📂 자료취합 현황</Typography>
          <Chip 
            icon={dbStatus === 'online' ? <WifiIcon /> : <WifiOffIcon />}
            label={dbStatus === 'online' ? "서버 연결됨" : "연결 끊김"}
            color={dbStatus === 'online' ? "success" : "error"}
            variant="outlined"
            onClick={checkConnection}
          />
        </Stack>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsRequestModalOpen(true)}>새로 요청하기</Button>
      </Box>

      {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}

      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8f9fa' }}>
            <TableRow>
              <TableCell>번호</TableCell>
              <TableCell>제목 (더블클릭 상세)</TableCell>
              <TableCell>요청자</TableCell>
              <TableCell>항목</TableCell>
              <TableCell>상태</TableCell>
              <TableCell align="right">작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.filter(req => req.requesterId === currentUser.employeeId || req.targetIds.includes(currentUser.employeeId)).map((req) => (
              <TableRow 
                key={req.id} 
                hover 
                onDoubleClick={() => { setSelectedRequest(req); setIsDetailOpen(true); }} 
                style={{ cursor: 'pointer' }}
              >
                <TableCell><Typography variant="body2" component="span">{req.requestNo}</Typography></TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{req.title}</TableCell>
                <TableCell>{req.requesterName}</TableCell>
                <TableCell>{req.items.length}개</TableCell>
                <TableCell>
                  {req.targetIds.includes(currentUser.employeeId) ? (
                    responses.some(r => r.requestId === req.id && r.targetId === currentUser.employeeId) ? (
                      <Chip 
                        label={responses.find(r => r.requestId === req.id && r.targetId === currentUser.employeeId)?.is_na ? '해당없음' : '제출완료'} 
                        color={responses.find(r => r.requestId === req.id && r.targetId === currentUser.employeeId)?.is_na ? 'default' : 'success'} 
                        size="small" 
                      />
                    ) : <Chip label="미제출" color="warning" size="small" />
                  ) : <Chip label="요청함" size="small" variant="outlined" />}
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    {req.targetIds.includes(currentUser.employeeId) && !responses.some(r => r.requestId === req.id && r.targetId === currentUser.employeeId) && (
                      <Button variant="contained" size="small" onClick={(e) => { e.stopPropagation(); setSelectedRequest(req); setIsInputModalOpen(true); setIsNA(false); setInputValues({}); }}>입력</Button>
                    )}
                    {req.requesterId === currentUser.employeeId && (
                      <IconButton size="small" color="error" onClick={(e) => openDeleteConfirm(e, req.id)}><DeleteIcon fontSize="small" /></IconButton>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* --- 삭제 확인 커스텀 모달 --- */}
      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <DialogTitle>정말 삭제하시겠습니까?</DialogTitle>
        <DialogContent>이 요청과 관련된 모든 데이터가 영구히 삭제됩니다.</DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteModalOpen(false)}>취소</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">삭제</Button>
        </DialogActions>
      </Dialog>

      {/* 새 요청 모달 */}
      <Dialog open={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} fullWidth maxWidth="md">
        <DialogTitle component="div" sx={{ fontWeight: 'bold' }}>새로운 자료취합 요청</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField label="제목" fullWidth value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <FormControl fullWidth>
              <InputLabel>대상자 선택</InputLabel>
              <Select 
                multiple 
                value={newTargetIds} 
                onChange={(e) => setNewTargetIds(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)} 
                input={<OutlinedInput label="대상자 선택" />} 
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((val) => {
                      const u = users.find(u => u.employeeId === val);
                      return <Chip key={val} label={u ? `${u.name} ${u.position}` : val} size="small" />;
                    })}
                  </Box>
                )}
              >
                {users.filter(u => u.employeeId !== currentUser.employeeId).map((user) => (
                  <MenuItem key={user.employeeId} value={user.employeeId}>
                    <Checkbox checked={newTargetIds.indexOf(user.employeeId) > -1} />
                    <ListItemText primary={`${user.name} ${user.position}`} secondary={`${user.department} / ${user.team}`} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Divider>항목 설정</Divider>
            {newItems.map((item, index) => (<Stack key={item.id} direction="row" spacing={2}><Typography sx={{ mt: 2 }}>{index + 1}.</Typography><TextField label="항목명" sx={{ flex: 3 }} value={item.name} onChange={(e) => { setNewItems(newItems.map(i => i.id === item.id ? { ...i, name: e.target.value } : i)); }} /><TextField select label="타입" sx={{ flex: 1 }} value={item.dataType} onChange={(e) => { setNewItems(newItems.map(i => i.id === item.id ? { ...i, dataType: e.target.value as any } : i)); }}><MenuItem value="text">텍스트</MenuItem><MenuItem value="number">숫자</MenuItem><MenuItem value="date">날짜</MenuItem></TextField><IconButton color="error" onClick={() => { if (newItems.length > 1) setNewItems(newItems.filter(i => i.id !== item.id)); }}><DeleteIcon /></IconButton></Stack>))}
            <Button variant="outlined" onClick={() => setNewItems([...newItems, { id: String(Date.now()), name: '', dataType: 'text' }])}>항목 추가</Button>
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setIsRequestModalOpen(false)}>취소</Button><Button variant="contained" onClick={handleCreateRequest}>생성</Button></DialogActions>
      </Dialog>

      {/* 데이터 입력 모달 */}
      <Dialog open={isInputModalOpen} onClose={() => setIsInputModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle component="div" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>{selectedRequest?.title}</Typography>
          <FormControlLabel
            control={<Checkbox checked={isNA} onChange={(e) => setIsNA(e.target.checked)} color="primary" />}
            label="해당없음"
          />
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1, opacity: isNA ? 0.5 : 1, pointerEvents: isNA ? 'none' : 'auto' }}>
            {selectedRequest?.items.map(item => (
              <TextField 
                key={item.id} 
                label={item.name} 
                fullWidth 
                required={!isNA}
                disabled={isNA}
                type={item.dataType === 'number' ? 'number' : item.dataType === 'date' ? 'date' : 'text'} 
                InputLabelProps={item.dataType === 'date' ? { shrink: true } : undefined} 
                value={inputValues[item.id] || ''}
                onChange={(e) => setInputValues({ ...inputValues, [item.id]: e.target.value })} 
              />
            ))}
          </Stack>
          {isNA && <Typography variant="body2" color="primary" sx={{ mt: 2, fontWeight: 600 }}>* [해당없음] 체크 시 입력 없이 제출됩니다.</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsInputModalOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleSubmitResponse}>제출</Button>
        </DialogActions>
      </Dialog>

      {/* 상세 결과 모달 */}
      <Dialog open={isDetailModalOpen} onClose={() => setIsDetailOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle component="div" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>[{selectedRequest?.requestNo}] {selectedRequest?.title}</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControlLabel
              control={<Checkbox size="small" checked={excludeNA} onChange={(e) => setExcludeNA(e.target.checked)} />}
              label={<Typography variant="body2">해당없음 제외</Typography>}
            />
            {selectedRequest && <Button startIcon={<DownloadIcon />} variant="outlined" size="small" onClick={() => downloadExcel(selectedRequest)}>엑셀 다운로드</Button>}
            <IconButton onClick={() => setIsDetailOpen(false)} size="small"><CloseIcon /></IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <TableContainer>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: '#eee', fontWeight: 'bold' }}>제출자</TableCell>
                  <TableCell sx={{ bgcolor: '#eee', fontWeight: 'bold' }}>상태</TableCell>
                  {selectedRequest?.items.map(item => <TableCell key={item.id} sx={{ bgcolor: '#eee', fontWeight: 'bold' }}>{item.name}</TableCell>)}
                  <TableCell sx={{ bgcolor: '#eee', fontWeight: 'bold' }}>시간</TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#eee', fontWeight: 'bold' }}>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedRequest && getFilteredResponses(selectedRequest.id).map(res => (
                  <TableRow key={res.id}>
                    <TableCell sx={{ fontWeight: 'medium' }}>{res.targetName}</TableCell>
                    <TableCell>
                      {res.is_na ? <Chip label="해당없음" size="small" variant="outlined" /> : <Chip label="제출" size="small" color="success" variant="outlined" />}
                    </TableCell>
                    {selectedRequest.items.map(item => (
                      <TableCell key={item.id}>{res.is_na ? '-' : (res.values[item.id] || '-')}</TableCell>
                    ))}
                    <TableCell variant="body">{res.submittedAt.slice(0, 16)}</TableCell>
                    <TableCell align="right">
                      {(res.targetId === currentUser.employeeId || selectedRequest.requesterId === currentUser.employeeId) && (
                        <IconButton size="small" color="error" onClick={() => { supabase.from('responses').delete().eq('id', res.id); loadResponses(); }}><DeleteIcon fontSize="small" /></IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
      </Dialog>
    </Box>
  );
};
