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
  Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import ListAltIcon from '@mui/icons-material/ListAlt';

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
  createdAt: string;
}

export const RequestManagement: React.FC = () => {
  const [templates, setTemplates] = useState<WorkTemplate[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  // 폼 상태
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<TemplateItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('work_templates');
    if (saved) {
      setTemplates(JSON.parse(saved));
    }
  }, []);

  const saveToStorage = (updated: WorkTemplate[]) => {
    setTemplates(updated);
    localStorage.setItem('work_templates', JSON.stringify(updated));
  };

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

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleAddItem = () => {
    setItems([...items, { id: Date.now().toString(), name: '', dataType: 'text' }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof TemplateItem, value: string) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleSave = () => {
    if (!title) return alert('업무명을 입력해주세요.');
    if (items.some(i => !i.name)) return alert('모든 항목의 이름을 입력해주세요.');

    const newTemplate: WorkTemplate = {
      id: editId || Date.now().toString(),
      title,
      description,
      items,
      createdAt: new Date().toLocaleString()
    };

    let updated: WorkTemplate[];
    if (editId) {
      updated = templates.map(t => t.id === editId ? newTemplate : t);
    } else {
      updated = [newTemplate, ...templates];
    }

    saveToStorage(updated);
    handleClose();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('정말 삭제하시겠습니까? 이 업무 형식을 사용하는 기존 데이터에 영향을 줄 수 있습니다.')) {
      const updated = templates.filter(t => t.id !== id);
      saveToStorage(updated);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ListAltIcon color="primary" /> 업무 형식 마스터 관리
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => handleOpen()}
          sx={{ borderRadius: 2 }}
        >
          업무 추가
        </Button>
      </Box>

      <Alert severity="info" sx={{ borderRadius: 2 }}>
        여기서 정의한 업무 형식은 사용자들이 '업무신청'을 할 때 선택할 수 있는 템플릿이 됩니다.
      </Alert>

      <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>업무명</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>설명</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>필요 항목</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>생성일</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>관리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <Typography color="text.secondary">등록된 업무 형식이 없습니다. 상단의 '업무 추가' 버튼을 눌러주세요.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              templates.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{t.title}</TableCell>
                  <TableCell variant="body" color="text.secondary">{t.description || '-'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {t.items.map(item => (
                        <Chip key={item.id} label={item.name} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell variant="body">{t.createdAt}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton size="small" color="primary" onClick={() => handleOpen(t)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(t.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 업무 추가/수정 모달 */}
      <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editId ? '업무 형식 수정' : '새로운 업무 형식 정의'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="업무명"
              fullWidth
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 법인카드 한도 증액 신청"
            />
            <TextField
              label="업무 설명"
              fullWidth
              multiline
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="이 업무에 대한 간단한 설명을 입력하세요."
            />
            
            <Divider>
              <Typography variant="body2" color="text.secondary">신청 시 입력받을 항목 설정</Typography>
            </Divider>

            {items.map((item, index) => (
              <Box key={item.id} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, position: 'relative' }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid size={1}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{index + 1}</Typography>
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      label="항목명"
                      fullWidth
                      size="small"
                      required
                      value={item.name}
                      onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                      placeholder="예: 희망 금액, 사유 등"
                    />
                  </Grid>
                  <Grid size={4}>
                    <TextField
                      select
                      label="데이터 타입"
                      fullWidth
                      size="small"
                      value={item.dataType}
                      onChange={(e) => handleItemChange(item.id, 'dataType', e.target.value)}
                    >
                      <MenuItem value="text">텍스트 (단답형)</MenuItem>
                      <MenuItem value="number">숫자</MenuItem>
                      <MenuItem value="date">날짜</MenuItem>
                      <MenuItem value="select">선택 (예/아니오)</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={1}>
                    <IconButton 
                      color="error" 
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={items.length === 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
            ))}

            <Button 
              variant="outlined" 
              startIcon={<AddIcon />} 
              onClick={handleAddItem}
              sx={{ borderStyle: 'dashed' }}
            >
              입력 항목 추가
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose}>취소</Button>
          <Button 
            variant="contained" 
            startIcon={<SaveIcon />} 
            onClick={handleSave}
            sx={{ px: 4 }}
          >
            저장하기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
