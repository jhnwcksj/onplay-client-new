
import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { formatPhoneNumber } from '../utils/phoneFormatter';
import { toast } from '../hooks/use-toast';
import * as XLSX from 'xlsx';
import './Clients.css';

// Declare API_URL once at the top
const API_URL = process.env.REACT_APP_API_URL;

export default function Clients() {
        // Фильтры
      const [serviceFilter, setServiceFilter] = useState('');
      const [sortType, setSortType] = useState('newest');
      // Колоночная сортировка
      const [columnSort, setColumnSort] = useState({ column: null, direction: null });
      // Диалог редактирования клиента
      const [editDialogOpen, setEditDialogOpen] = useState(false);
      const [editingClient, setEditingClient] = useState(null);
      const [editForm, setEditForm] = useState({});
      const [editSaving, setEditSaving] = useState(false);
      const [editError, setEditError] = useState(null);
      
      // Import/Export state
      const [showImportExportMenu, setShowImportExportMenu] = useState(false);
      const [importDialogOpen, setImportDialogOpen] = useState(false);
      const [importFile, setImportFile] = useState(null);
      const [importProcessing, setImportProcessing] = useState(false);
      const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
      const [duplicateData, setDuplicateData] = useState(null);
      const importFileInputRef = useRef(null);
      const importExportMenuRef = useRef(null);
      
        // Для фильтра по услугам: appointments
        const [appointments, setAppointments] = useState([]);
  useEffect(() => {
    if (!serviceFilter) {
      setAppointments([]);
      return;
    }
    async function fetchAppointments() {
      try {
        const res = await fetch(API_URL + '/appointments?service_id=' + Number(serviceFilter));
        if (!res.ok) throw new Error('Ошибка загрузки записей');
        const data = await res.json();
        setAppointments(data);
      } catch (e) {
        setAppointments([]);
      }
    }
    fetchAppointments();
  }, [serviceFilter]);


  // Список услуг для фильтра
  const [servicesList, setServicesList] = useState([{ id: '', name: 'Все услуги' }]);
  useEffect(() => {
    async function fetchServices() {
      try {
        let branchId = null;
        try {
          const params = new URLSearchParams(window.location.search);
          branchId = params.get('branchId');
        } catch { branchId = null; }
        if (!branchId) branchId = localStorage.getItem('selectedBranchId');
        let url = API_URL + '/all-services';
        if (branchId) url += '?branch_id=' + encodeURIComponent(branchId);
        const res = await fetch(url);
        if (!res.ok) throw new Error('Ошибка загрузки услуг');
        const data = await res.json();
        setServicesList([{ id: '', name: 'Все услуги' }, ...data.map(s => ({ id: String(s.service_id), name: s.name }))]);
      } catch (e) {
        setServicesList([{ id: '', name: 'Все услуги' }]);
      }
    }
    fetchServices();
  }, []);
  
  // Close import/export menu on outside click
  useEffect(() => {
    if (!showImportExportMenu) return;
    function handleClick(e) {
      if (importExportMenuRef.current && !importExportMenuRef.current.contains(e.target)) {
        setShowImportExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showImportExportMenu]);
  
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

        // Поиск
        const [searchValue, setSearchValue] = useState('');
        const [search, setSearch] = useState('');

        // Сначала фильтруем клиентов по услуге (appointments), чтобы результат был сразу после получения appointments
        const clientsByService = React.useMemo(() => {
          if (!serviceFilter) return clients;
          let filteredAppointments = appointments;
          if (appointments.length && appointments.some(a => String(a.service_id) !== String(serviceFilter))) {
            filteredAppointments = appointments.filter(a => String(a.service_id) === String(serviceFilter));
          }
          const appointmentClientIds = filteredAppointments.map(a => String(a.client_id ?? a.id)).filter(Boolean);
          const clientIdsSet = new Set(appointmentClientIds);
          return clients.filter(c => clientIdsSet.has(String(c.client_id ?? c.id)));
        }, [clients, appointments, serviceFilter]);

        // Затем применяем поиск и сортировку только к уже отфильтрованным по услуге клиентам
        const filteredClients = React.useMemo(() => {
          let arr = clientsByService;
          if (search) {
            const q = search.trim().toLowerCase();
            arr = arr.filter(c =>
              (c.name && c.name.toLowerCase().includes(q)) ||
              (c.phone && c.phone.toLowerCase().includes(q)) ||
              (c.email && c.email.toLowerCase().includes(q))
            );
          }
          arr = [...arr];
          
          // Если активна колоночная сортировка, используем её
          if (columnSort.column && columnSort.direction) {
            const { column, direction } = columnSort;
            
            if (column === 'name') {
              arr.sort((a, b) => {
                const aName = (a.name || '').toLowerCase();
                const bName = (b.name || '').toLowerCase();
                // Сначала английские (a-z), затем остальные
                const aIsEnglish = /^[a-z]/.test(aName);
                const bIsEnglish = /^[a-z]/.test(bName);
                if (aIsEnglish && !bIsEnglish) return -1;
                if (!aIsEnglish && bIsEnglish) return 1;
                return direction === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
              });
            } else if (column === 'phone') {
              arr.sort((a, b) => {
                const aPhone = a.phone || '';
                const bPhone = b.phone || '';
                return direction === 'asc' ? aPhone.localeCompare(bPhone) : bPhone.localeCompare(aPhone);
              });
            } else if (column === 'email') {
              arr.sort((a, b) => {
                const aEmail = (a.email || '').toLowerCase();
                const bEmail = (b.email || '').toLowerCase();
                return direction === 'asc' ? aEmail.localeCompare(bEmail) : bEmail.localeCompare(aEmail);
              });
            } else if (column === 'spent') {
              arr.sort((a, b) => {
                return direction === 'asc' ? (a.spent || 0) - (b.spent || 0) : (b.spent || 0) - (a.spent || 0);
              });
            } else if (column === 'visits') {
              arr.sort((a, b) => {
                return direction === 'asc' ? (a.visits_count || 0) - (b.visits_count || 0) : (b.visits_count || 0) - (a.visits_count || 0);
              });
            } else if (column === 'last_visit') {
              arr.sort((a, b) => {
                const aDate = new Date(a.last_visit || 0);
                const bDate = new Date(b.last_visit || 0);
                return direction === 'asc' ? aDate - bDate : bDate - aDate;
              });
            } else if (column === 'first_visit') {
              arr.sort((a, b) => {
                const aDate = new Date(a.first_visit || 0);
                const bDate = new Date(b.first_visit || 0);
                return direction === 'asc' ? aDate - bDate : bDate - aDate;
              });
            }
          } else {
            // Используем sortType из фильтра
            if (sortType === 'price-asc') {
              arr.sort((a, b) => (a.spent || 0) - (b.spent || 0));
            } else if (sortType === 'price-desc') {
              arr.sort((a, b) => (b.spent || 0) - (a.spent || 0));
            } else if (sortType === 'newest') {
              arr.sort((a, b) => new Date(b.created_at || b.first_visit || 0) - new Date(a.created_at || a.first_visit || 0));
            } else if (sortType === 'oldest') {
              arr.sort((a, b) => new Date(a.created_at || a.first_visit || 0) - new Date(b.created_at || b.first_visit || 0));
            } else if (sortType === 'first-visit-asc') {
              arr.sort((a, b) => new Date(a.first_visit || 0) - new Date(b.first_visit || 0));
            } else if (sortType === 'first-visit-desc') {
              arr.sort((a, b) => new Date(b.first_visit || 0) - new Date(a.first_visit || 0));
            } else if (sortType === 'last-visit-asc') {
              arr.sort((a, b) => new Date(a.last_visit || 0) - new Date(b.last_visit || 0));
            } else if (sortType === 'last-visit-desc') {
              arr.sort((a, b) => new Date(b.last_visit || 0) - new Date(a.last_visit || 0));
            } else if (sortType === 'visits-asc') {
              arr.sort((a, b) => (a.visits_count || 0) - (b.visits_count || 0));
            } else if (sortType === 'visits-desc') {
              arr.sort((a, b) => (b.visits_count || 0) - (a.visits_count || 0));
            }
          }
          return arr;
        }, [clientsByService, search, sortType, columnSort]);
  // Список клиентов должен быть объявлен первым!
  // const [clients, setClients] = useState([]);
  // Состояние для выбранных клиентов
  const [selectedClients, setSelectedClients] = useState([]);

      // Обработчик колоночной сортировки
      function handleColumnSort(column) {
        setColumnSort(prev => {
          // Если тот же столбец - меняем направление
          if (prev.column === column) {
            // desc -> asc -> null (сброс)
            if (prev.direction === 'desc') {
              return { column, direction: 'asc' };
            }
            return { column: null, direction: null };
          }
          // Новый столбец - начинаем с desc (по убыванию)
          return { column, direction: 'desc' };
        });
        // Сбрасываем фильтр сортировки
        setSortType('newest');
      }
      
      // Иконка сортировки
      function getSortIcon(column) {
        if (columnSort.column !== column) return null;
        return columnSort.direction === 'desc' ? ' ▼' : ' ▲';
      }

      // Обработчик для чекбокса строки
      function handleClientCheckbox(client, checked) {
        setSelectedClients(prev => {
          const id = client.client_id ?? client.id;
          if (checked) {
            return [...prev, id];
          } else {
            return prev.filter(cid => cid !== id);
          }
        });
      }

      // Обработчик для чекбокса "выбрать все"
      function handleSelectAll(checked) {
        if (checked) {
          setSelectedClients(pagedClients.map(c => c.client_id ?? c.id));
        } else {
          setSelectedClients([]);
        }
      }

      // Массовое удаление
      async function handleBulkDelete() {
        if (!window.confirm('Удалить выбранных клиентов?')) return;
        for (const id of selectedClients) {
          const client = clients.find(c => (c.client_id ?? c.id) === id);
          if (client) {
            await onDeleteClient(client, { skipConfirm: true });
          }
        }
        setSelectedClients([]);
      }
      
      // Excel Export
      async function handleExport() {
        try {
          let branchId = null;
          try {
            const params = new URLSearchParams(location.search);
            branchId = params.get('branchId');
          } catch {}
          if (!branchId) branchId = localStorage.getItem('selectedBranchId');
          
          if (!branchId) {
            toast({ title: 'Ошибка', description: 'Выберите филиал', variant: 'destructive' });
            return;
          }

          const token = localStorage.getItem('token');
          const url = `${API_URL}/clients/export?branchId=${branchId}`;
          const res = await fetch(url, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });

          if (!res.ok) {
            throw new Error('Ошибка экспорта');
          }

          const blob = await res.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `clients_${branchId}_${new Date().toISOString().split('T')[0]}.xlsx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);

          toast({ title: 'Успешно', description: 'Клиенты экспортированы' });
          setShowImportExportMenu(false);
        } catch (err) {
          toast({ title: 'Ошибка', description: 'Ошибка экспорта: ' + err.message, variant: 'destructive' });
        }
      }

      // Excel Import with chunked upload for memory optimization
      async function handleImport() {
        if (!importFile) {
          toast({ title: 'Ошибка', description: 'Выберите файл', variant: 'destructive' });
          return;
        }

        setImportProcessing(true);
        try {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const data = new Uint8Array(e.target.result);
              const workbook = XLSX.read(data, { type: 'array' });
              const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
              const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

              // Free memory
              delete e.target.result;

              // Skip header row
              const dataRows = rows.slice(1).filter(row => row && row.length > 0);
              
              if (dataRows.length === 0) {
                toast({ title: 'Ошибка', description: 'Файл пустой', variant: 'destructive' });
                setImportProcessing(false);
                return;
              }

              const clientsToImport = dataRows.map((row, idx) => {
                const [name, phone, email, categories, birthDate, spent, paid, gender, card, discount, lastVisit, firstVisit, visitsCount, comment, additionalPhone, agreedToMailing, agreedToDataProcessing] = row;
                
                // Normalize phone number
                let normalizedPhone = '';
                if (phone) {
                  normalizedPhone = String(phone).replace(/[^\d]/g, '');
                }

                // Build client object without null/empty values to reduce payload size
                const client = {
                  rowIndex: idx + 2,
                  name: name || '',
                  phone: normalizedPhone
                };
                if (email) client.email = email;
                if (birthDate) client.birth_date = birthDate;
                if (spent) client.spent = parseFloat(spent);
                if (paid) client.paid = parseFloat(paid);
                if (gender) client.gender = gender;
                if (discount) client.discount = parseFloat(discount);
                if (lastVisit) client.last_visit = lastVisit;
                if (firstVisit) client.first_visit = firstVisit;
                if (visitsCount) client.visits_count = parseInt(visitsCount);
                if (comment) client.comment = comment;
                if (additionalPhone) client.additional_phone = additionalPhone;
                if (agreedToMailing === 'Да') client.agreed_to_mailing = true;
                if (agreedToDataProcessing === 'Да') client.agreed_to_data_processing = true;
                
                return client;
              });

              let branchId = null;
              try {
                const params = new URLSearchParams(location.search);
                branchId = params.get('branchId');
              } catch {}
              if (!branchId) branchId = localStorage.getItem('selectedBranchId');

              const token = localStorage.getItem('token');
              const url = `${API_URL}/clients/import`;
              
              // Send in chunks of 500 to reduce memory usage
              const CHUNK_SIZE = 500;
              let allDuplicates = [];
              let totalImported = 0;
              
              for (let i = 0; i < clientsToImport.length; i += CHUNK_SIZE) {
                const chunk = clientsToImport.slice(i, i + CHUNK_SIZE);
                
                const res = await fetch(url, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                  body: JSON.stringify({
                    branchId: Number(branchId),
                    clients: chunk
                  })
                });

                if (!res.ok) {
                  const text = await res.text();
                  throw new Error(text || 'Ошибка импорта');
                }

                const result = await res.json();
                totalImported += (result.imported || 0);
                
                if (result.duplicates && result.duplicates.length > 0) {
                  allDuplicates = allDuplicates.concat(result.duplicates);
                }
              }
              
              const result = { imported: totalImported, duplicates: allDuplicates };
              
              if (result.duplicates && result.duplicates.length > 0) {
                // Show duplicate resolution dialog
                setDuplicateData({
                  duplicates: result.duplicates,
                  newClients: result.newClients || []
                });
                setDuplicateDialogOpen(true);
              } else {
                toast({ 
                  title: 'Успешно', 
                  description: `Импортировано ${result.imported || 0} клиентов` 
                });
                setImportDialogOpen(false);
                setImportFile(null);
                // Reload clients after toast
                setTimeout(() => window.location.reload(), 1000);
              }

              if (!result.duplicates || result.duplicates.length === 0) {
                // Only close dialog and clear file if no duplicates (already done above)
              } else {
                setImportDialogOpen(false);
                setImportFile(null);
              }
            } catch (err) {
              toast({ title: 'Ошибка', description: 'Произошла ошибка при импорте', variant: 'destructive' });
            } finally {
              setImportProcessing(false);
            }
          };
          reader.readAsArrayBuffer(importFile);
        } catch (err) {
          toast({ title: 'Ошибка', description: 'Ошибка импорта: ' + err.message, variant: 'destructive' });
          setImportProcessing(false);
        }
      }

      // Handle duplicate resolution
      async function handleDuplicateResolution(action, duplicateIndex) {
        // action: 'keep_old' or 'update_new'
        try {
          const token = localStorage.getItem('token');
          const duplicate = duplicateData.duplicates[duplicateIndex];
          
          const url = `${API_URL}/clients/resolve-duplicate`;
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              action,
              existing: duplicate.existing,
              newData: duplicate.new
            })
          });

          if (!res.ok) {
            throw new Error('Ошибка разрешения дубликата');
          }

          // Remove resolved duplicate from list
          const updatedDuplicates = duplicateData.duplicates.filter((_, idx) => idx !== duplicateIndex);
          
          if (updatedDuplicates.length === 0) {
            setDuplicateDialogOpen(false);
            toast({ title: 'Успешно', description: 'Все конфликты разрешены' });
            window.location.reload();
          } else {
            setDuplicateData({ ...duplicateData, duplicates: updatedDuplicates });
          }
        } catch (err) {
          toast({ title: 'Ошибка', description: err.message, variant: 'destructive' });
        }
      }

      // Handle all duplicates at once
      async function handleAllDuplicates(action) {
        try {
          const token = localStorage.getItem('token');
          const allDuplicates = [...duplicateData.duplicates];
          
          // Process all duplicates
          for (const duplicate of allDuplicates) {
            const url = `${API_URL}/clients/resolve-duplicate`;
            const res = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                action,
                existing: duplicate.existing,
                newData: duplicate.new
              })
            });

            if (!res.ok) {
              throw new Error('Ошибка разрешения дубликата');
            }
          }

          setDuplicateDialogOpen(false);
          toast({ title: 'Успешно', description: 'Все конфликты разрешены' });
          window.location.reload();
        } catch (err) {
          toast({ title: 'Ошибка', description: err.message, variant: 'destructive' });
        }
      }
      
    // Удаление клиента
    async function onDeleteClient(client, opts = {}) {
      if (!opts.skipConfirm) {
        if (!window.confirm('Удалить клиента: ' + client.name + '?')) return;
      }
      try {
        const token = localStorage.getItem('token');
        const url = `${API_URL}/clients/${client.client_id ?? client.id}`;
        const res = await fetch(url, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) {
          const text = await res.text();
          toast({ title: 'Ошибка', description: 'Ошибка при удалении клиента: ' + text, variant: 'destructive' });
          return;
        }
        setClients(prev => prev.filter(c => (c.client_id ?? c.id) !== (client.client_id ?? client.id)));
        if (!opts.skipConfirm) {
          toast({ title: 'Успешно', description: 'Клиент удален' });
        }
      } catch (err) {
        toast({ title: 'Ошибка', description: 'Ошибка при удалении клиента: ' + err.message, variant: 'destructive' });
      }
    }
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    additional_phone: '',
    email: '',
    gender: '',
    birth_date: '',
    comment: '',
    agreed_to_mailing: false,
    agreed_to_personal_data: false,
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  useEffect(() => {
    document.title = 'Клиентская база';
  }, []);

  // Determine whether the current app theme/background is dark and respond to changes
  const darkThemeKeys = React.useMemo(() => new Set(['dark', 'purple', 'ocean', 'sunset']), []);
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    try {
      const cssText = getComputedStyle(document.documentElement).getPropertyValue('--theme-text').trim();
      if (cssText && cssText.startsWith('#')) {
        const rgb = parseInt(cssText.slice(1), 16);
        const r = (rgb >> 16) & 0xff;
        const g = (rgb >> 8) & 0xff;
        const b = rgb & 0xff;
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return lum > 0.7;
      }
      const saved = localStorage.getItem('appTheme') || 'light';
      return darkThemeKeys.has(saved);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handler = (e) => {
      try {
        if (e && e.detail && typeof e.detail.isDark !== 'undefined') {
          setIsDarkTheme(Boolean(e.detail.isDark));
          return;
        }
        const cssText = getComputedStyle(document.documentElement).getPropertyValue('--theme-text').trim();
        if (cssText && cssText.startsWith('#')) {
          const rgb = parseInt(cssText.slice(1), 16);
          const r = (rgb >> 16) & 0xff;
          const g = (rgb >> 8) & 0xff;
          const b = rgb & 0xff;
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          setIsDarkTheme(lum > 0.7);
          return;
        }
        const saved = localStorage.getItem('appTheme') || 'light';
        setIsDarkTheme(darkThemeKeys.has(saved));
      } catch {}
    };
    window.addEventListener('appThemeChanged', handler);
    return () => window.removeEventListener('appThemeChanged', handler);
  }, [darkThemeKeys]);

  const [calendarDate] = React.useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [selectedDate] = React.useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });


  // Removed unused: activeSegment, setActiveSegment

  const location = useLocation();

  const formatMoney = (value) => {
    const num = Number(value) || 0;
    return `${num.toLocaleString('ru-RU')} тг`;
  };

  // Removed unused: formatDate

  const formatDateTime = (value) => {
    if (!value) return '';
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  useEffect(() => {
    let mounted = true;

    async function loadClients() {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');

        let branchId = null;
        try {
          const params = new URLSearchParams(location.search);
          branchId = params.get('branchId');
        } catch {
          branchId = null;
        }
        if (!branchId) {
          branchId = localStorage.getItem('selectedBranchId');
        }

        // Проверка доступа: если нет branchId, запрещаем доступ
        if (!branchId) {
          if (!mounted) return;
          setClients([]);
          setError('Необходимо создать Сеть и Филиал для доступа к клиентам');
          setLoading(false);
          return;
        }

        // Дополнительная проверка: проверяем доступ пользователя к филиалу
        const stored = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
        const uid = stored?.id || localStorage.getItem('userId');
        
        if (uid) {
          // Загружаем филиалы пользователя для проверки доступа
          const branchesEndpoints = [
            `${API_URL}/users/${uid}/branches`,
            `${API_URL}/branches?userId=${uid}`,
            `${API_URL}/branches?user_id=${uid}`,
          ];
          
          // Admin bypass: allow access to any branch
          const userRole = stored?.role || 'user';
          let userHasAccess = (userRole === 'admin');
          
          if (!userHasAccess) {
            for (const endpoint of branchesEndpoints) {
              try {
                const res = await fetch(endpoint, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
                if (res.ok) {
                  const data = await res.json();
                  const branches = Array.isArray(data) ? data : (data.branches || data.rows || []);
                  const found = branches.find(b => String(b.branch_id || b.id || b.branchId) === String(branchId));
                  if (found) {
                    userHasAccess = true;
                    break;
                  }
                }
              } catch {}
            }
          }
          
          if (!userHasAccess) {
            if (!mounted) return;
            setClients([]);
            setError('');
            setLoading(false);
            return;
          }
        }

        const q = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';
        const url = `${API_URL}/clients${q}`;

        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(
            `Ошибка при загрузке клиентов: ${res.status} ${res.statusText} ${
              text ? '- ' + text.slice(0, 200) : ''
            }`,
          );
        }

        const ct = (res.headers.get('content-type') || '').toLowerCase();
        let data;
        if (ct.includes('application/json')) {
          data = await res.json();
        } else {
          const text = await res.text();
          throw new Error(
            'Сервер вернул неожиданный ответ (не JSON). Ответ: ' +
              text.slice(0, 200),
          );
        }

        if (!mounted) return;
        const list = Array.isArray(data) ? data : data.clients || [];
        setClients(list);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Не удалось загрузить клиентов');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadClients();

    return () => {
      mounted = false;
    };
  }, [location.search]);

  // Pagination logic
  const total = filteredClients.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);
  const pagedClients = filteredClients.slice(startIdx, endIdx);

  // For page buttons
  const pageButtons = [];
  for (let i = 1; i <= totalPages && i <= 5; i++) {
    pageButtons.push(i);
  }

  const userName = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).name : 'Пользователь';
  const userEmail = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'email@example.com';
  const userRole = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).role || 'user' : 'user';

  return (
    <div className="timetable-wrapper clients-page">
      <Sidebar
        calendarDate={calendarDate}
        setCalendarDate={() => {}}
        selectedDate={selectedDate}
        setSelectedDate={() => {}}
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        loadingUser={false}
        userError={null}
      />

      <div className={`clients-content ${isDarkTheme ? 'dark-theme' : ''}`}>
        <div className="clients-header">
          <div className="clients-title">
            <div className="clients-main">Клиентская база</div>
            <div className="clients-sub">Клиенты</div>
          </div>
          <div className="clients-actions" style={{display:'flex',alignItems:'center',gap:12}}>
            {selectedClients.length > 0 && (
              <button className="btn danger" style={{marginRight:8}} onClick={handleBulkDelete}>
                Удалить выбранных ({selectedClients.length})
              </button>
            )}
            <button className="btn yellow" onClick={() => setDialogOpen(true)}>
              <span className="plus">+</span> Добавить клиента
            </button>
            
            {/* Import/Export Button */}
            <div style={{position:'relative'}} ref={importExportMenuRef}>
              <button 
                className="btn"
                onClick={() => setShowImportExportMenu(!showImportExportMenu)}
              >
                📊 Импорт/Экспорт
              </button>
              {showImportExportMenu && (
                <div style={{
                  position:'absolute',
                  top:'calc(100% + 8px)',
                  right:0,
                  background:'var(--theme-background, white)',
                  border:'1px solid var(--theme-border, #e5e7eb)',
                  borderRadius:'8px',
                  boxShadow:'0 4px 12px rgba(0,0,0,0.15)',
                  zIndex:1000,
                  minWidth:'180px'
                }}>
                  <button
                    onClick={() => {
                      setImportDialogOpen(true);
                      setShowImportExportMenu(false);
                    }}
                    style={{
                      width:'100%',
                      padding:'12px 16px',
                      border:'none',
                      background:'transparent',
                      textAlign:'left',
                      cursor:'pointer',
                      fontSize:'14px',
                      color:'var(--theme-text, #374151)',
                      transition:'background 0.15s'
                    }}
                    onMouseEnter={e => e.target.style.background = 'var(--theme-hover, #f3f4f6)'}
                    onMouseLeave={e => e.target.style.background = 'transparent'}
                  >
                    📥 Импорт
                  </button>
                  <button
                    onClick={handleExport}
                    style={{
                      width:'100%',
                      padding:'12px 16px',
                      border:'none',
                      background:'transparent',
                      textAlign:'left',
                      cursor:'pointer',
                      fontSize:'14px',
                      color:'var(--theme-text, #374151)',
                      transition:'background 0.15s',
                      borderTop:'1px solid var(--theme-border, #e5e7eb)'
                    }}
                    onMouseEnter={e => e.target.style.background = 'var(--theme-hover, #f3f4f6)'}
                    onMouseLeave={e => e.target.style.background = 'transparent'}
                  >
                    📤 Экспорт
                  </button>
                </div>
              )}
            </div>
            
            {dialogOpen && (
                  <div className="network-dialog-backdrop" onClick={() => setDialogOpen(false)}>
                    <div className="network-dialog" onClick={e => e.stopPropagation()}>
                      <div className="network-dialog-header">
                        <h2 className="network-dialog-title">Добавить клиента</h2>
                        <button type="button" className="network-dialog-close" onClick={() => setDialogOpen(false)} aria-label="Закрыть">×</button>
                      </div>
                      <form
                        className="network-dialog-body"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          setCreating(true);
                          setCreateError(null);
                          try {
                            const token = localStorage.getItem('token');
                            let branchId = null;
                            try {
                              const params = new URLSearchParams(location.search);
                              branchId = params.get('branchId');
                            } catch { branchId = null; }
                            if (!branchId) branchId = localStorage.getItem('selectedBranchId');
                            const url = `${API_URL}/clients`;
                            const body = {
                              branch_id: Number(branchId),
                              name: form.name,
                              phone: form.phone,
                              additional_phone: form.additional_phone,
                              email: form.email,
                              gender: form.gender,
                              birth_date: form.birth_date,
                              comment: form.comment,
                              agreed_to_mailing: form.agreed_to_mailing,
                              agreed_to_personal_data: form.agreed_to_personal_data,
                            };
                            const res = await fetch(url, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                              },
                              body: JSON.stringify(body),
                            });
                            if (!res.ok) {
                              const text = await res.text();
                              throw new Error(`Ошибка: ${res.status} ${res.statusText} ${text}`);
                            }
                            toast({ title: 'Успешно', description: 'Клиент создан' });
                            setDialogOpen(false);
                            setForm({
                              name: '', phone: '', additional_phone: '', email: '', gender: '', birth_date: '', comment: '', agreed_to_mailing: false, agreed_to_personal_data: false
                            });
                            setCreating(false);
                            setCreateError(null);
                            setLoading(true);
                            setTimeout(() => window.location.reload(), 500);
                          } catch (err) {
                            setCreateError(err.message);
                            setCreating(false);
                            toast({ title: 'Ошибка', description: err.message, variant: 'destructive' });
                          }
                        }}
                      >
                        <label className="network-field-label">
                          Имя
                          <input required className="network-field-input" placeholder="Имя" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                        </label>
                        <label className="network-field-label">
                          Телефон
                          <input className="network-field-input" placeholder="Телефон" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                        </label>
                        <label className="network-field-label">
                          Доп. телефон
                          <input className="network-field-input" placeholder="Доп. телефон" value={form.additional_phone} onChange={e => setForm(f => ({ ...f, additional_phone: e.target.value }))} />
                        </label>
                        <label className="network-field-label">
                          Email
                          <input className="network-field-input" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                        </label>
                        <label className="network-field-label">
                          Пол
                          <select className="network-field-input" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                            <option value="">Выберите пол</option>
                            <option value="male">Мужской</option>
                            <option value="female">Женский</option>
                          </select>
                        </label>
                        <label className="network-field-label">
                          Дата рождения
                          <input type="date" className="network-field-input" value={form.birth_date} onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))} />
                        </label>
                        <label className="network-field-label">
                          Комментарий
                          <textarea className="network-field-input" placeholder="Комментарий" value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} />
                        </label>
                        {/* <label className="network-field-label">
                          <input type="checkbox" checked={form.agreed_to_mailing} onChange={e => setForm(f => ({ ...f, agreed_to_mailing: e.target.checked }))} /> Согласен на рассылку
                        </label>
                        <label className="network-field-label">
                          <input type="checkbox" checked={form.agreed_to_personal_data} onChange={e => setForm(f => ({ ...f, agreed_to_personal_data: e.target.checked }))} /> Согласен на обработку персональных данных
                        </label> */}
                        {createError && <div className="network-dialog-error">{createError}</div>}
                        <div className="network-dialog-footer">
                          <button type="button" className="btn secondary" onClick={() => setDialogOpen(false)} disabled={creating}>Отмена</button>
                          <button type="submit" className="btn yellow" disabled={creating}>Создать</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
                
            {/* Import Dialog */}
            {importDialogOpen && (
              <div className="network-dialog-backdrop" onClick={() => setImportDialogOpen(false)}>
                <div className="network-dialog" onClick={e => e.stopPropagation()} style={{maxWidth:'600px'}}>
                  <div className="network-dialog-header">
                    <h2 className="network-dialog-title">Импорт клиентов</h2>
                    <button type="button" className="network-dialog-close" onClick={() => setImportDialogOpen(false)}>×</button>
                  </div>
                  <div className="network-dialog-body">
                    <div style={{marginBottom:'16px'}}>
                      <h3 style={{fontSize:'16px',fontWeight:'600',marginBottom:'8px'}}>Как импортировать:</h3>
                      <ol style={{paddingLeft:'20px',fontSize:'14px',lineHeight:'1.6'}}>
                        <li>Скачайте шаблон Excel файла</li>
                        <li>Заполните данные клиентов (начиная со 2-й строки)</li>
                        <li>Загрузите заполненный файл</li>
                      </ol>
                    </div>
                    
                    <div style={{marginBottom:'16px',padding:'12px',background:'var(--theme-hover, #f9fafb)',borderRadius:'8px'}}>
                      <p style={{fontSize:'13px',color:'var(--theme-subtext, #6b7280)',marginBottom:'8px'}}>
                        <strong>Формат номера:</strong> Система автоматически распознает различные форматы:
                      </p>
                      <ul style={{paddingLeft:'20px',fontSize:'12px',color:'var(--theme-subtext, #9ca3af)'}}>
                        <li>77001234567</li>
                        <li>+7 700 123 45 67</li>
                        <li>7 (700) 123-45-67</li>
                      </ul>
                    </div>

                    <a 
                      href="/clients_template.xls" 
                      download
                      style={{
                        display:'inline-block',
                        marginBottom:'16px',
                        padding:'8px 16px',
                        background:'var(--theme-primary, #3b82f6)',
                        color:'white',
                        borderRadius:'6px',
                        textDecoration:'none',
                        fontSize:'14px'
                      }}
                    >
                      📥 Скачать шаблон Excel
                    </a>

                    <label className="network-field-label">
                      Выберите файл Excel
                      <input 
                        ref={importFileInputRef}
                        type="file" 
                        accept=".xlsx,.xls"
                        className="network-field-input"
                        onChange={e => setImportFile(e.target.files[0])}
                        style={{padding:'8px'}}
                      />
                    </label>

                    {importFile && (
                      <div style={{marginTop:'8px',fontSize:'13px',color:'var(--theme-text, #374151)'}}>
                        Файл: {importFile.name}
                      </div>
                    )}
                  </div>
                  <div className="network-dialog-footer">
                    <button 
                      type="button" 
                      className="btn secondary" 
                      onClick={() => setImportDialogOpen(false)}
                      disabled={importProcessing}
                    >
                      Отмена
                    </button>
                    <button 
                      type="button" 
                      className="btn yellow" 
                      onClick={handleImport}
                      disabled={!importFile || importProcessing}
                    >
                      {importProcessing ? 'Импорт...' : 'Импортировать'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Duplicate Resolution Dialog */}
            {duplicateDialogOpen && duplicateData && (
              <div className="network-dialog-backdrop" onClick={() => setDuplicateDialogOpen(false)}>
                <div className="network-dialog" onClick={e => e.stopPropagation()} style={{maxWidth:'700px'}}>
                  <div className="network-dialog-header">
                    <h2 className="network-dialog-title">Обнаружены дубликаты</h2>
                    <button type="button" className="network-dialog-close" onClick={() => setDuplicateDialogOpen(false)}>×</button>
                  </div>
                  <div className="network-dialog-body">
                    <p style={{marginBottom:'16px',fontSize:'14px'}}>
                      Найдены клиенты с одинаковыми телефонами. Выберите действие:
                    </p>
                    <div style={{maxHeight:'400px',overflowY:'auto',marginBottom:'16px'}}>
                      {duplicateData.duplicates.map((dup, idx) => (
                        <div key={idx} style={{
                          marginBottom:'16px',
                          padding:'12px',
                          border:'1px solid var(--theme-border, #e5e7eb)',
                          borderRadius:'8px'
                        }}>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
                            <div>
                              <strong style={{fontSize:'13px',color:'var(--theme-subtext, #6b7280)'}}>Существующий:</strong>
                              <div style={{fontSize:'14px',marginTop:'4px'}}>
                                <div>Имя: {dup.existing.name}</div>
                                <div>Телефон: {dup.existing.phone}</div>
                                <div>Email: {dup.existing.email || '—'}</div>
                                <div>Визиты: {dup.existing.visits_count || 0}</div>
                              </div>
                            </div>
                            <div>
                              <strong style={{fontSize:'13px',color:'var(--theme-subtext, #6b7280)'}}>Новый:</strong>
                              <div style={{fontSize:'14px',marginTop:'4px'}}>
                                <div>Имя: {dup.new.name}</div>
                                <div>Телефон: {dup.new.phone}</div>
                                <div>Email: {dup.new.email || '—'}</div>
                                <div>Визиты: {dup.new.visits_count || 0}</div>
                              </div>
                            </div>
                          </div>
                          <div style={{display:'flex',gap:'8px'}}>
                            <button
                              className="btn secondary"
                              style={{fontSize:'13px'}}
                              onClick={() => handleDuplicateResolution('keep_old', idx)}
                            >
                              Оставить старые данные
                            </button>
                            <button
                              className="btn yellow"
                              style={{fontSize:'13px'}}
                              onClick={() => handleDuplicateResolution('update_new', idx)}
                            >
                              Обновить на новые данные
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{display:'flex',gap:'8px',justifyContent:'flex-end',paddingTop:'8px',borderTop:'1px solid var(--theme-border, #e5e7eb)'}}>
                      <button
                        className="btn secondary"
                        style={{fontSize:'13px'}}
                        onClick={() => {
                          if (window.confirm('Оставить старые данные для всех дубликатов?')) {
                            handleAllDuplicates('keep_old');
                          }
                        }}
                      >
                        Оставить старые данные для всех
                      </button>
                      <button
                        className="btn yellow"
                        style={{fontSize:'13px'}}
                        onClick={() => {
                          if (window.confirm('Обновить на новые данные для всех дубликатов?')) {
                            handleAllDuplicates('update_new');
                          }
                        }}
                      >
                        Обновить на новые данные для всех
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>

        <div className="clients-search">
          <div className="search-wrap" style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
            <input
              placeholder="Поиск (по имени, телефону, Email или номеру карты)"
              className="search-input"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setSearch(searchValue);
                  setPage(1);
                }
              }}
              style={{width:'100%'}}
            />
            <button
              className="btn small search-btn"
              style={{marginLeft:8,minWidth:120}}
              onClick={() => { setSearch(searchValue); setPage(1); }}
            >
              Найти
            </button>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:24,marginTop:12,marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontWeight:500,fontSize:16}}>Фильтры:</span>
              <select
                className="filter-select"
                value={serviceFilter}
                onChange={e => {
                  setServiceFilter(e.target.value);
                  setAppointments([]); // сбрасываем appointments для новой услуги
                  setPage(1); // сбрасываем страницу на первую
                }}
                style={{padding:'6px 16px',borderRadius:6,border:'1px solid #d1d5db',background:'#fff',fontSize:15,minWidth:140}}
              >
                {servicesList.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div style={{position:'relative'}}>
              <select
                className="filter-select"
                value={sortType}
                onChange={e => {
                  setSortType(e.target.value);
                  setColumnSort({ column: null, direction: null });
                }}
                style={{padding:'6px 16px',borderRadius:6,border:'1px solid #d1d5db',background:'#222c36',color:'#fff',fontSize:15,minWidth:220,fontWeight:500}}
              >
                <option value="price-asc">Цена (по возрастанию)</option>
                <option value="price-desc">Цена (по убыванию)</option>
                <option value="newest">Сначала новые</option>
                <option value="oldest">Сначала старые</option>
                <option value="first-visit-asc">Первый визит (по возрастанию)</option>
                <option value="first-visit-desc">Первый визит (по убыванию)</option>
                <option value="last-visit-asc">Последний визит (по возрастанию)</option>
                <option value="last-visit-desc">Последний визит (по убыванию)</option>
                <option value="visits-asc">Визиты (по возрастанию)</option>
                <option value="visits-desc">Визиты (по убыванию)</option>
              </select>
            </div>
          </div>
        </div>

        {/*
        <div className="clients-filters">
          <div className="clients-segments">
            <span className="segments-label">Сегменты:</span>
            <button
              type="button"
              className={
                'link-like' + (activeSegment === 'new' ? ' active' : '')
              }
              onClick={() => setActiveSegment('new')}
            >
              Новые
            </button>
            <button
              type="button"
              className={
                'link-like' + (activeSegment === 'repeat' ? ' active' : '')
              }
              onClick={() => setActiveSegment('repeat')}
            >
              Повторные
            </button>
          </div>
        </div>
        */}

        <div className="clients-table-wrap">
          <table className="clients-table">
            <thead>
              <tr>
                <th className="col-checkbox">
                  <input
                    type="checkbox"
                    checked={pagedClients.length > 0 && pagedClients.every(c => selectedClients.includes(c.client_id ?? c.id))}
                    indeterminate={pagedClients.some(c => selectedClients.includes(c.client_id ?? c.id)) && !pagedClients.every(c => selectedClients.includes(c.client_id ?? c.id))}
                    onChange={e => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th style={{cursor:'pointer',userSelect:'none'}} onClick={() => handleColumnSort('name')}>
                  Имя{getSortIcon('name')}
                </th>
                <th className="has-lock" style={{cursor:'pointer',userSelect:'none'}} onClick={() => handleColumnSort('phone')}>
                  Телефон{getSortIcon('phone')}
                </th>
                <th className="has-lock" style={{cursor:'pointer',userSelect:'none'}} onClick={() => handleColumnSort('email')}>
                  Email{getSortIcon('email')}
                </th>
                <th style={{cursor:'pointer',userSelect:'none'}} onClick={() => handleColumnSort('spent')}>
                  Продано{getSortIcon('spent')}
                </th>
                <th style={{cursor:'pointer',userSelect:'none'}} onClick={() => handleColumnSort('visits')}>
                  Визиты{getSortIcon('visits')}
                </th>
                <th className="has-lock" style={{cursor:'pointer',userSelect:'none'}} onClick={() => handleColumnSort('last_visit')}>
                  Последний визит{getSortIcon('last_visit')}
                </th>
                <th className="has-lock" style={{cursor:'pointer',userSelect:'none'}} onClick={() => handleColumnSort('first_visit')}>
                  Первый визит{getSortIcon('first_visit')}
                </th>
                <th className="col-actions"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="9">Загрузка клиентов...</td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan="9">{error}</td>
                </tr>
              )}
              {!loading && !error && clients.length === 0 && (
                <tr>
                  <td colSpan="9">Клиенты не найдены.</td>
                </tr>
              )}
              {!loading && !error &&
                pagedClients.map((client) => (
                  <tr key={client.client_id ?? client.id}>
                    <td className="col-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedClients.includes(client.client_id ?? client.id)}
                        onChange={e => handleClientCheckbox(client, e.target.checked)}
                      />
                    </td>
                    <td>
                      <button 
                        type="button" 
                        className="client-link"
                        onClick={() => {
                          setEditingClient(client);
                          setEditForm({
                            name: client.name || '',
                            phone: client.phone || '',
                            additional_phone: client.additional_phone || '',
                            email: client.email || '',
                            gender: client.gender || '',
                            birth_date: client.birth_date || '',
                            comment: client.comment || '',
                            agreed_to_mailing: client.agreed_to_mailing || false,
                            agreed_to_personal_data: client.agreed_to_personal_data || false,
                          });
                          setEditDialogOpen(true);
                          setEditError(null);
                        }}
                      >
                        {client.name}
                      </button>
                    </td>
                    <td>{formatPhoneNumber(client.phone)}</td>
                    <td>{client.email || ''}</td>
                    <td>{formatMoney(client.spent)}</td>
                    <td>{client.visits_count || 0}</td>
                    <td>{formatDateTime(client.last_visit)}</td>
                    <td>{formatDateTime(client.first_visit)}</td>
                    <td className="col-actions">
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Удалить клиента"
                        style={{ color: '#e53935', fontSize: '18px' }}
                        onClick={() => onDeleteClient(client)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <div className="clients-footer">
            <div className="pagination-left">
              <select className="page-size-select" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span>результатов на странице</span>
            </div>
            <div className="pagination-center">
              Показаны результаты с {total === 0 ? 0 : startIdx + 1} по {endIdx} из {total}
            </div>
            <div className="pagination-right">
              <button type="button" className="btn small secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Назад</button>
              <div className="pagination-pages">
                {pageButtons.map(num => (
                  <button
                    key={num}
                    type="button"
                    className={"page-btn" + (num === currentPage ? " active" : "")}
                    onClick={() => setPage(num)}
                  >
                    {num}
                  </button>
                ))}
                {totalPages > 5 && <span className="page-dots">...</span>}
              </div>
              <button type="button" className="btn small secondary" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Вперед</button>
              {/* <button type="button" className="btn actions-btn">Действия ▾</button> */}
            </div>
          </div>
        </div>
        
        {/* Диалог редактирования клиента */}
        {editDialogOpen && editingClient && (
          <div className="network-dialog-backdrop" onClick={() => setEditDialogOpen(false)}>
            <div className="network-dialog" onClick={e => e.stopPropagation()}>
              <div className="network-dialog-header">
                <h2 className="network-dialog-title">Редактировать клиента</h2>
                <button type="button" className="network-dialog-close" onClick={() => setEditDialogOpen(false)} aria-label="Закрыть">×</button>
              </div>
              <form
                className="network-dialog-body"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setEditSaving(true);
                  setEditError(null);
                  try {
                    const token = localStorage.getItem('token');
                    const url = `${API_URL}/clients/${editingClient.client_id ?? editingClient.id}`;
                    const body = {
                      name: editForm.name,
                      phone: editForm.phone,
                      additional_phone: editForm.additional_phone,
                      email: editForm.email,
                      gender: editForm.gender,
                      birth_date: editForm.birth_date,
                      comment: editForm.comment,
                      agreed_to_mailing: editForm.agreed_to_mailing,
                      agreed_to_personal_data: editForm.agreed_to_personal_data,
                    };
                    const res = await fetch(url, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                      },
                      body: JSON.stringify(body),
                    });
                    if (!res.ok) {
                      const text = await res.text();
                      throw new Error(`Ошибка: ${res.status} ${res.statusText} ${text}`);
                    }
                    toast({ title: 'Успешно', description: 'Клиент обновлен' });
                    setEditDialogOpen(false);
                    setEditingClient(null);
                    setEditSaving(false);
                    // Перезагрузка данных
                    setTimeout(() => window.location.reload(), 500);
                  } catch (err) {
                    setEditError(err.message);
                    setEditSaving(false);
                    toast({ title: 'Ошибка', description: err.message, variant: 'destructive' });
                  }
                }}
              >
                <label className="network-field-label">
                  Имя
                  <input required className="network-field-input" placeholder="Имя" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                </label>
                <label className="network-field-label">
                  Телефон
                  <input className="network-field-input" placeholder="Телефон" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                </label>
                <label className="network-field-label">
                  Доп. телефон
                  <input className="network-field-input" placeholder="Доп. телефон" value={editForm.additional_phone} onChange={e => setEditForm(f => ({ ...f, additional_phone: e.target.value }))} />
                </label>
                <label className="network-field-label">
                  Email
                  <input className="network-field-input" placeholder="Email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
                </label>
                <label className="network-field-label">
                  Пол
                  <select className="network-field-input" value={editForm.gender} onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))}>
                    <option value="">Выберите пол</option>
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                  </select>
                </label>
                <label className="network-field-label">
                  Дата рождения
                  <input type="date" className="network-field-input" value={editForm.birth_date} onChange={e => setEditForm(f => ({ ...f, birth_date: e.target.value }))} />
                </label>
                <label className="network-field-label">
                  Комментарий
                  <textarea className="network-field-input" placeholder="Комментарий" value={editForm.comment} onChange={e => setEditForm(f => ({ ...f, comment: e.target.value }))} />
                </label>
                {editError && <div className="network-dialog-error">{editError}</div>}
                <div className="network-dialog-footer" style={{display:'flex',gap:8,justifyContent:'space-between'}}>
                  <button 
                    type="button" 
                    className="btn danger" 
                    onClick={async () => {
                      if (!window.confirm('Удалить этого клиента?')) return;
                      try {
                        await onDeleteClient(editingClient);
                        toast({ title: 'Успешно', description: 'Клиент удален' });
                        setEditDialogOpen(false);
                        setEditingClient(null);
                      } catch (err) {
                        toast({ title: 'Ошибка', description: err.message, variant: 'destructive' });
                      }
                    }}
                    disabled={editSaving}
                  >
                    Удалить
                  </button>
                  <div style={{display:'flex',gap:8}}>
                    <button type="button" className="btn secondary" onClick={() => setEditDialogOpen(false)} disabled={editSaving}>Отмена</button>
                    <button type="submit" className="btn yellow" disabled={editSaving}>Сохранить</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
