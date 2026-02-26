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
  Stack,
  Divider,
  Grid,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import DescriptionIcon from '@mui/icons-material/Description';
import CloseIcon from '@mui/icons-material/Close';

// Supabase Import
import { supabase } from '../supabase';

interface Document {
  id: string;
  doc_no: string;
  title: string;
  content: string;
  dept: string;
  enforcer_name: string;
  enforced_at: string;
  created_at: string;
}

export const DocumentManagement: React.FC<{ currentUser: { employeeId: string; name: string } }> = ({ currentUser }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 모달 상태
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  // 폼 필드 상태
  const [docNo, setDocNo] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [dept, setDept] = useState('');
  const [enforcerName, setEnforcerName] = useState('');
  const [enforcedAt, setEnforcedAt] = useState(new Date().toISOString().slice(0, 16));

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setDocuments(data);
    } catch (e: any) {
      console.error('로드 실패:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenForm = () => {
    setDocNo(`DOC-${new Date().getTime().toString().slice(-6)}`);
    setTitle('');
    setContent('');
    setDept('');
    setEnforcerName('');
    setEnforcedAt(new Date().toISOString().slice(0, 16));
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!title || !enforcerName) return alert('문서명과 시행자를 입력해주세요.');

    try {
      const { error } = await supabase.from('documents').insert([{
        doc_no: docNo,
        title,
        content,
        dept: dept,
        enforcer_name: enforcerName,
        enforced_at: enforcedAt,
        created_by: currentUser.employeeId
      }]);

      if (error) throw error;
      setIsFormOpen(false);
      loadData();
    } catch (e: any) {
      alert('저장 실패: ' + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('정말 이 문서를 삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (e: any) {
      alert('삭제 실패: ' + e.message);
    }
  };

  const handleRowDoubleClick = (doc: Document) => {
    setSelectedDoc(doc);
    setIsDetailOpen(true);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <DescriptionIcon color="primary" /> 공식 문서 관리함
        </Typography>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={loadData} disabled={loading} size="small">
            <RefreshIcon fontSize="small" />
          </IconButton>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleOpenForm}
            sx={{ borderRadius: 2 }}
          >
            문서 추가
          </Button>
        </Stack>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, width: '120px' }}>문서번호</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>문서명</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>내용 요약</TableCell>
              <TableCell sx={{ fontWeight: 700, width: '150px' }}>시행부서/자</TableCell>
              <TableCell sx={{ fontWeight: 700, width: '180px' }}>시행일시</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, width: '80px' }}>관리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}><CircularProgress size={24} /></TableCell></TableRow>
            ) : documents.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}>등록된 문서가 없습니다.</TableCell></TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow 
                  key={doc.id} 
                  hover 
                  onDoubleClick={() => handleRowDoubleClick(doc)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell sx={{ fontFamily: 'monospace' }}>{doc.doc_no}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{doc.title}</TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '300px'
                      }}
                    >
                      {doc.content || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{doc.dept}</Typography>
                    <Typography variant="caption" color="text.secondary">{doc.enforcer_name}</Typography>
                  </TableCell>
                  <TableCell>{new Date(doc.enforced_at).toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 문서 추가 모달 */}
      <Dialog open={isFormOpen} onClose={() => setIsFormOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 700 }}>신규 문서 등록</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid size={6}>
              <TextField label="문서번호" fullWidth value={docNo} disabled variant="filled" />
            </Grid>
            <Grid size={6}>
              <TextField 
                label="시행일시" 
                type="datetime-local" 
                fullWidth 
                value={enforcedAt} 
                onChange={(e) => setEnforcedAt(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={12}>
              <TextField 
                label="문서명" 
                fullWidth 
                required 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="공식 문서 제목을 입력하세요."
              />
            </Grid>
            <Grid size={6}>
              <TextField 
                label="시행자" 
                fullWidth 
                required 
                value={enforcerName} 
                onChange={(e) => setEnforcerName(e.target.value)}
                placeholder="시행자 성명을 입력하세요."
              />
            </Grid>
            <Grid size={6}>
              <TextField 
                label="시행부서" 
                fullWidth 
                value={dept} 
                onChange={(e) => setDept(e.target.value)} 
                placeholder="시행 부서명을 입력하세요."
              />
            </Grid>
            <Grid size={12}>
              <TextField 
                label="문서 내용" 
                fullWidth 
                multiline 
                rows={10} 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder="상세 내용을 입력하세요. 텍스트 분량에 제한이 없습니다."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setIsFormOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleSave} sx={{ px: 4 }}>문서 저장</Button>
        </DialogActions>
      </Dialog>

      {/* 상세 보기 모달 */}
      <Dialog open={isDetailOpen} onClose={() => setIsDetailOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800 }}>
          <Box>
            <Typography variant="caption" color="primary" sx={{ display: 'block', mb: -0.5, fontFamily: 'monospace' }}>
              {selectedDoc?.doc_no}
            </Typography>
            {selectedDoc?.title}
          </Box>
          <IconButton onClick={() => setIsDetailOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid size={4}>
                <Typography variant="caption" color="text.secondary">시행부서</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedDoc?.dept}</Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant="caption" color="text.secondary">시행자</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedDoc?.enforcer_name}</Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant="caption" color="text.secondary">시행일시</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedDoc && new Date(selectedDoc.enforced_at).toLocaleString()}</Typography>
              </Grid>
            </Grid>
          </Box>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, minHeight: '200px' }}>
            {selectedDoc?.content}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsDetailOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
