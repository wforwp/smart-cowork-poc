import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Chip,
  Divider,
  Alert,
  Grid,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import ListAltIcon from '@mui/icons-material/ListAlt';
import RefreshIcon from '@mui/icons-material/Refresh';

// Supabase Import
import { supabase } from '../supabase';

interface TemplateItem {
  id: string;
  name: string;
  dataType: 'text' | 'number' | 'date' | 'select';
}

interface WorkTemplate {
  id: string;
  title: string;
  description: string;
  items: TemplateItem[];
  created_at: string;
}

export const RequestManagement: React.FC = () => {
  const [templates, setTemplates] = useState<WorkTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<TemplateItem[]>([]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('work_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setTemplates(data);
    } catch (e: any) {
      alert('데이터 로드 실패: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleOpen = (template?: WorkTemplate) => {
    if (template) {
      setEditId(template.id);
      setTitle(template.title);
      setDescription(template.description);
      setItems(template.items);
    } else {
      setEditId(null);
      setTitle('');
      setDescription('');
      setItems([{ id: Date.now().toString(), name: '', dataType: 'text' }]);
    }
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!title) return alert('업무명을 입력해주세요.');
    if (items.some(i => !i.name)) return alert('모든 항목의 이름을 입력해주세요.');

    try {
      if (editId) {
        const { error } = await supabase
          .from('work_templates')
          .update({ title, description, items })
          .eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('work_templates')
          .insert([{ title, description, items }]);
        if (error) throw error;
      }
      setIsOpen(false);
      loadTemplates();
    } catch (e: any) {
      alert('저장 실패: ' + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        const { error } = await supabase.from('work_templates').delete().eq('id', id);
        if (error) throw error;
        loadTemplates();
      } catch (e: any) {
        alert('삭제 실패: ' + e.message);
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ListAltIcon color="primary" /> 업무 형식 마스터 관리
        </Typography>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={loadTemplates} disabled={loading} size="small">
            <RefreshIcon fontSize="small" />
          </IconButton>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()} sx={{ borderRadius: 2 }}>
            업무 추가
          </Button>
        </Stack>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>업무명</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>필요 항목</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>생성일</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>관리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 8 }}><CircularProgress size={24} /></TableCell></TableRow>
            ) : templates.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 8 }}>데이터가 없습니다.</TableCell></TableRow>
            ) : (
              templates.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{t.description}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {t.items.map(item => <Chip key={item.id} label={item.name} size="small" variant="outlined" />)}
                    </Box>
                  </TableCell>
                  <TableCell variant="body">{new Date(t.created_at).toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton size="small" color="primary" onClick={() => handleOpen(t)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(t.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 700 }}>{editId ? '업무 형식 수정' : '새로운 업무 형식 정의'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField label="업무명" fullWidth required value={title} onChange={(e) => setTitle(e.target.value)} />
            <TextField label="업무 설명" fullWidth multiline rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            <Divider><Typography variant="body2" color="text.secondary">신청 항목 설정</Typography></Divider>
            {items.map((item, index) => (
              <Box key={item.id} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid size={1}><Typography variant="subtitle2">{index + 1}</Typography></Grid>
                  <Grid size={6}><TextField label="항목명" fullWidth size="small" value={item.name} onChange={(e) => setItems(items.map(i => i.id === item.id ? { ...i, name: e.target.value } : i))} /></Grid>
                  <Grid size={4}>
                    <TextField select label="타입" fullWidth size="small" value={item.dataType} onChange={(e) => setItems(items.map(i => i.id === item.id ? { ...i, dataType: e.target.value as any } : i))}>
                      <MenuItem value="text">텍스트</MenuItem>
                      <MenuItem value="number">숫자</MenuItem>
                      <MenuItem value="date">날짜</MenuItem>
                      <MenuItem value="select">선택(예/아니오)</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={1}><IconButton color="error" onClick={() => items.length > 1 && setItems(items.filter(i => i.id !== item.id))}><DeleteIcon /></IconButton></Grid>
                </Grid>
              </Box>
            ))}
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setItems([...items, { id: Date.now().toString(), name: '', dataType: 'text' }])}>항목 추가</Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setIsOpen(false)}>취소</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>저장하기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
