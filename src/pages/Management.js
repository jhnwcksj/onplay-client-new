import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { toast } from '../hooks/use-toast';
import './Management.css';

const API_URL = process.env.REACT_APP_API_URL;

export default function Management() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  })();

  const currentUser = storedUser || null;
  useEffect(() => { document.title = 'Управление'; }, []);
  const [users, setUsers] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(false);
  const darkThemeKeys = useMemo(() => new Set(['dark', 'purple', 'ocean', 'sunset']), []);
  const [isDark, setIsDark] = useState(() => {
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
    } catch { return false; }
  });

  // Модальные окна
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [showAddBranchDialog, setShowAddBranchDialog] = useState(false);
  const [showEditBranchDialog, setShowEditBranchDialog] = useState(false);

  // Шаги для добавления сети/филиала
  const [branchCreationStep, setBranchCreationStep] = useState(1); // 1: выбор пользователя, 2: выбор/создание сети, 3: создание филиала
  const [selectedUserForBranch, setSelectedUserForBranch] = useState(null);
  const [createNewNetwork, setCreateNewNetwork] = useState(false);
  const [selectedNetworkForBranch, setSelectedNetworkForBranch] = useState(null);

  // Форма добавления пользователя
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'user',
    networkId: '',
    branchId: '',
  });

  // Форма редактирования пользователя
  const [editUser, setEditUser] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    role: 'user',
  });

  // Форма добавления сети/филиала
  const [newNetwork, setNewNetwork] = useState({
    name: '',
    slug: '',
    description: '',
  });

  const [newBranch, setNewBranch] = useState({
    networkId: '',
    branchName: '',
    city: '',
    address: '',
    phone: '',
    timezone: 'Asia/Almaty',
    userId: '',
    validFrom: '',
    validUntil: '',
    licenseStatus: 'free_trial',
  });

  // Форма редактирования филиала
  const [editBranch, setEditBranch] = useState({
    branchId: '',
    branchName:  '',
    category: '', // Категория филиала
    city: '',
    address: '',
    phone: '',
    timezone: 'Asia/Almaty',
    validFrom: '',
    validUntil: '',
    licenseStatus: 'free_trial',
  });

  // Проверка прав доступа
  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
      // Пользователь не авторизован для управления — молча перенаправляем на главную
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Theme detection like Timetable/License
  useEffect(() => {
    const handler = (e) => {
      try {
        if (e && e.detail && typeof e.detail.isDark !== 'undefined') { setIsDark(Boolean(e.detail.isDark)); return; }
        const cssText = getComputedStyle(document.documentElement).getPropertyValue('--theme-text').trim();
        if (cssText && cssText.startsWith('#')) {
          const rgb = parseInt(cssText.slice(1), 16);
          const r = (rgb >> 16) & 0xff;
          const g = (rgb >> 8) & 0xff;
          const b = rgb & 0xff;
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          setIsDark(lum > 0.7);
          return;
        }
        const saved = localStorage.getItem('appTheme') || 'light';
        setIsDark(darkThemeKeys.has(saved));
      } catch {}
    };
    window.addEventListener('appThemeChanged', handler);
    return () => window.removeEventListener('appThemeChanged', handler);
  }, [darkThemeKeys]);

  // Загрузка списка пользователей (только для admin/manager)
  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) return;
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.role]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/management/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.status === 401) {
        // Токен невалиден - очистить и перенаправить на логин
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        navigate('/login');
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Ошибка загрузки пользователей');
      }
      
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось загрузить список пользователей',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Загрузка детальной информации о пользователе
  const loadUserDetails = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/management/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Ошибка загрузки данных пользователя');
      
      const data = await response.json();
      setSelectedUser(data);
      setNetworks(data.networks || []);
      setBranches(data.branches || []);
    } catch (error) {
      console.error('Error loading user details:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные пользователя',
        variant: 'destructive',
      });
    }
  };

  // Добавление пользователя
  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!newUser.email || !newUser.password) {
      toast({
        title: 'Ошибка',
        description: 'Заполните обязательные поля: Email и Пароль',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/management/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка создания пользователя');
      }

      toast({
        title: 'Успешно',
        description: 'Пользователь создан',
      });

      setShowAddUserDialog(false);
      setNewUser({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'user',
        networkId: '',
        branchId: '',
      });
      loadUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resetNetworkForm = () => {
    setNewNetwork({
      name: '',
      slug: '',
      description: '',
    });
    setNewBranch({
      networkId: '',
      branchName: '',
      city: '',
      address: '',
      phone: '',
      timezone: 'Asia/Almaty',
      userId: '',
      validFrom: '',
      validUntil: '',
      licenseStatus: 'free_trial',
    });
    setBranchCreationStep(1);
    setSelectedUserForBranch(null);
    setCreateNewNetwork(false);
    setSelectedNetworkForBranch(null);
  };

  // Открыть диалог добавления филиала (шаг 1: выбор пользователя)
  const openAddBranchDialog = () => {
    resetNetworkForm();
    setShowAddBranchDialog(true);
  };

  // Открыть диалог добавления филиала для конкретного пользователя
  const openAddBranchForUser = async (user) => {
    resetNetworkForm();
    setSelectedUserForBranch(user);
    setBranchCreationStep(2);
    
    // Загрузить сети пользователя
    try {
      const response = await fetch(`${API_URL}/api/management/users/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setNetworks(data.networks || []);
      }
    } catch (error) {
      console.error('Error loading user networks:', error);
    }
    
    setShowAddBranchDialog(true);
  };

  // Открыть диалог редактирования филиала
  const openEditBranchDialog = (branch) => {
    setEditBranch({
      branchId: branch.branch_id,
      branchName: branch.branch_name,
      category: branch.category || '', // Категория филиала
      city: branch.city,
      address: branch.address,
      phone: branch.phone,
      timezone: branch.timezone || 'Asia/Almaty',
      validFrom: branch.valid_from ? branch.valid_from.split('T')[0] : '',
      validUntil: branch.valid_until ? branch.valid_until.split('T')[0] : '',
      licenseStatus: branch.license_status || 'free_trial',
    });
    setShowEditBranchDialog(true);
  };

  // Перейти к следующему шагу
  const handleNextStep = async () => {
    if (branchCreationStep === 1 && !selectedUserForBranch) {
      toast({
        title: 'Ошибка',
        description: 'Выберите пользователя',
        variant: 'destructive',
      });
      return;
    }
    if (branchCreationStep === 2 && !createNewNetwork && !selectedNetworkForBranch) {
      toast({
        title: 'Ошибка',
        description: 'Выберите сеть или создайте новую',
        variant: 'destructive',
      });
      return;
    }

    // Если переходим с шага 1 на шаг 2, загружаем сети пользователя
    if (branchCreationStep === 1) {
      try {
        const response = await fetch(`${API_URL}/api/management/users/${selectedUserForBranch.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setNetworks(data.networks || []);
        }
      } catch (error) {
        console.error('Error loading user networks:', error);
      }
    }

    setBranchCreationStep(branchCreationStep + 1);
  };

  // Обработка создания нового филиала
  const handleCreateBranch = async (e) => {
    e.preventDefault();

    try {
      let networkId = selectedNetworkForBranch?.network_id;

      // Если нужно создать новую сеть
      if (createNewNetwork) {
        if (!newNetwork.name) {
          toast({
            title: 'Ошибка',
            description: 'Укажите название сети',
            variant: 'destructive',
          });
          return;
        }

        const networkResponse = await fetch(`${API_URL}/api/management/networks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...newNetwork,
            userId: selectedUserForBranch.id,
          }),
        });

        if (!networkResponse.ok) {
          const error = await networkResponse.json();
          throw new Error(error.message || 'Ошибка создания сети');
        }

        const networkData = await networkResponse.json();
        networkId = networkData.network.network_id;
      }

      // Создать филиал
      const branchResponse = await fetch(`${API_URL}/api/management/branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          networkId: networkId,
          branchName: newBranch.branchName,
          city: newBranch.city,
          address: newBranch.address,
          phone: newBranch.phone,
          timezone: newBranch.timezone,
          userId: selectedUserForBranch.id,
          validFrom: newBranch.validFrom,
          validUntil: newBranch.validUntil,
          licenseStatus: newBranch.licenseStatus,
        }),
      });

      if (!branchResponse.ok) {
        const error = await branchResponse.json();
        throw new Error(error.message || 'Ошибка создания филиала');
      }

      toast({
        title: 'Успешно',
        description: 'Филиал создан',
      });

      setShowAddBranchDialog(false);
      resetNetworkForm();
      
      // Обновить данные пользователя если он выбран
      if (selectedUser?.id === selectedUserForBranch.id) {
        loadUserDetails(selectedUserForBranch.id);
      }
    } catch (error) {
      console.error('Error creating branch:', error);
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Обработка обновления филиала
  const handleUpdateBranch = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/api/management/branches/${editBranch.branchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          branchName: editBranch.branchName,
          category: editBranch.category, // Категория филиала
          city: editBranch.city,
          address: editBranch.address,
          phone: editBranch.phone,
          timezone: editBranch.timezone,
          validFrom: editBranch.validFrom,
          validUntil: editBranch.validUntil,
          licenseStatus: editBranch.licenseStatus,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка обновления филиала');
      }

      toast({
        title: 'Успешно',
        description: 'Филиал обновлен',
      });

      setShowEditBranchDialog(false);
      
      // Обновить данные филиалов
      if (selectedUser) {
        await loadUserDetails(selectedUser.id);
      }
      
      // Обновить список филиалов в UI сразу
      setBranches(prevBranches => 
        prevBranches.map(b => 
          b.branch_id === editBranch.branchId 
            ? { ...b, ...response.branch || {}, category: editBranch.category }
            : b
        )
      );
    } catch (error) {
      console.error('Error updating branch:', error);
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Переход в филиал - открывается в новой вкладке браузера
  const handleGoToBranch = (branchId) => {
    const url = `/timetable/${currentUser.id}?branchId=${branchId}`;
    window.open(url, '_blank');
  };

  const getRoleLabel = (role) => {
    const labels = {
      'user': 'Пользователь',
      'vip-user': 'VIP Пользователь',
      'manager': 'Менеджер',
      'admin': 'Администратор',
    };
    return labels[role] || role;
  };

  // Группировка пользователей по referred_by (от кого пришел)
  const groupUsersByReferredBy = () => {
    const groups = {};
    
    users.forEach(user => {
      const referrerId = user.referred_by;
      let groupKey;
      
      if (!referrerId) {
        groupKey = 'direct';
      } else if (referrerId === currentUser?.id) {
        groupKey = currentUser.name || currentUser.email || 'Я';
      } else {
        const referrer = users.find(u => u.id === referrerId);
        groupKey = referrer ? (referrer.name || referrer.email) : `ID: ${referrerId}`;
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(user);
    });
    
    return groups;
  };

  // Найти пользователя по ID для отображения имени реферера
  const getReferrerName = (referrerKey) => {
    if (!referrerKey || referrerKey === 'direct') return 'Остальные';
    return referrerKey; // Теперь это уже имя, не ID
  };

  // Проверить, может ли текущий пользователь редактировать другого пользователя
  const canEditUser = (userToEdit) => {
    if (!currentUser) return false;
    
    const requesterRole = currentUser.role;
    const targetRole = userToEdit.role;
    
    // Менеджер не может редактировать менеджеров и администраторов
    if (requesterRole === 'manager' && (targetRole === 'manager' || targetRole === 'admin')) {
      return false;
    }
    
    // Администратор не может редактировать администраторов
    if (requesterRole === 'admin' && targetRole === 'admin') {
      return false;
    }
    
    return true;
  };

  // Открыть диалог редактирования пользователя
  const openEditUserDialog = (user) => {
    setEditUser({
      id: user.id,
      name: user.name || '',
      email: user.email,
      phone: user.phone || '',
      role: user.role,
    });
    setShowEditUserDialog(true);
  };

  // Обновление пользователя
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    if (!editUser.email) {
      toast({
        title: 'Ошибка',
        description: 'Email обязателен',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/management/users/${editUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editUser.name,
          email: editUser.email,
          phone: editUser.phone,
          role: editUser.role,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка обновления пользователя');
      }

      toast({
        title: 'Успешно',
        description: 'Пользователь обновлен',
      });

      setShowEditUserDialog(false);
      loadUsers();
      if (selectedUser?.id === editUser.id) {
        loadUserDetails(editUser.id);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className={`management-wrapper ${isDark ? 'dark-theme' : ''}`}>
      <Sidebar
        userName={currentUser?.name || 'Пользователь'}
        userEmail={currentUser?.email || ''}
        userRole={currentUser?.role}
        loadingUser={false}
        userError={null}
      />

      <div className="management-content">
        <div className="management-header">
          <h1>Управление</h1>
          <div className="management-actions">
            <button
              className="btn btn-primary"
              onClick={() => setShowAddUserDialog(true)}
            >
              + Добавить пользователя
            </button>
            <button
              className="btn btn-secondary"
              onClick={openAddBranchDialog}
            >
              + Добавить филиал
            </button>
          </div>
        </div>

        <div className="management-body">
          {/* Список пользователей */}
          <div className="users-panel">
            <h2>Пользователи</h2>
            {loading ? (
              <p>Загрузка...</p>
            ) : (
              <div className="users-list">
                {(() => {
                  const groups = groupUsersByReferredBy();
                  const direct = groups['direct'] || [];
                  const adminsFromDirect = direct.filter(u => u.role === 'admin');
                  const managersFromDirect = direct.filter(u => u.role === 'manager');
                  const othersFromDirect = direct.filter(u => u.role !== 'admin' && u.role !== 'manager');

                  // Render admins (from direct) first
                  return (
                    <>
                      {adminsFromDirect.length > 0 && (
                        <div className="user-group">
                          <div className="user-group-header">
                            <strong>Администраторы</strong>
                            <span className="user-group-count">({adminsFromDirect.length})</span>
                          </div>
                          {adminsFromDirect.map(user => (
                            <div
                              key={user.id}
                              className={`user-card ${selectedUser?.id === user.id ? 'active' : ''}`}
                            >
                              <div onClick={() => loadUserDetails(user.id)}>
                                <div className="user-card-name">{user.name || user.email}</div>
                                <div className="user-card-role">{getRoleLabel(user.role)}</div>
                                <div className="user-card-email">{user.email}</div>
                              </div>
                              {canEditUser(user) && (
                                <button
                                  className="user-edit-btn"
                                  onClick={(e) => { e.stopPropagation(); openEditUserDialog(user); }}
                                  title="Редактировать"
                                >
                                  ✏️
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {managersFromDirect.length > 0 && (
                        <div className="user-group">
                          <div className="user-group-header">
                            <strong>Менеджеры</strong>
                            <span className="user-group-count">({managersFromDirect.length})</span>
                          </div>
                          {managersFromDirect.map(user => (
                            <div
                              key={user.id}
                              className={`user-card ${selectedUser?.id === user.id ? 'active' : ''}`}
                            >
                              <div onClick={() => loadUserDetails(user.id)}>
                                <div className="user-card-name">{user.name || user.email}</div>
                                <div className="user-card-role">{getRoleLabel(user.role)}</div>
                                <div className="user-card-email">{user.email}</div>
                              </div>
                              {canEditUser(user) && (
                                <button
                                  className="user-edit-btn"
                                  onClick={(e) => { e.stopPropagation(); openEditUserDialog(user); }}
                                  title="Редактировать"
                                >
                                  ✏️
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Render other groups excluding 'direct' */}
                      {Object.entries(groups)
                        .filter(([k]) => k !== 'direct')
                        .sort(([keyA], [keyB]) => {
                          if (keyA === 'direct') return 1;
                          if (keyB === 'direct') return -1;
                          return 0;
                        })
                        .map(([referrerId, groupUsers]) => (
                          <div key={referrerId} className="user-group">
                            <div className="user-group-header">
                              <strong>{getReferrerName(referrerId)}</strong>
                              <span className="user-group-count">({groupUsers.length})</span>
                            </div>
                            {groupUsers.map(user => (
                              <div
                                key={user.id}
                                className={`user-card ${selectedUser?.id === user.id ? 'active' : ''}`}
                              >
                                <div onClick={() => loadUserDetails(user.id)}>
                                  <div className="user-card-name">{user.name || user.email}</div>
                                  <div className="user-card-role">{getRoleLabel(user.role)}</div>
                                  <div className="user-card-email">{user.email}</div>
                                </div>
                                {canEditUser(user) && (
                                  <button 
                                    className="user-edit-btn"
                                    onClick={(e) => { e.stopPropagation(); openEditUserDialog(user); }}
                                    title="Редактировать"
                                  >
                                    ✏️
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        ))}

                      {/* Finally render remaining 'Остальные' from direct that are not admins/managers */}
                      {othersFromDirect.length > 0 && (
                        <div className="user-group">
                          <div className="user-group-header">
                            <strong>Остальные</strong>
                            <span className="user-group-count">({othersFromDirect.length})</span>
                          </div>
                          {othersFromDirect.map(user => (
                            <div
                              key={user.id}
                              className={`user-card ${selectedUser?.id === user.id ? 'active' : ''}`}
                            >
                              <div onClick={() => loadUserDetails(user.id)}>
                                <div className="user-card-name">{user.name || user.email}</div>
                                <div className="user-card-role">{getRoleLabel(user.role)}</div>
                                <div className="user-card-email">{user.email}</div>
                              </div>
                              {canEditUser(user) && (
                                <button 
                                  className="user-edit-btn"
                                  onClick={(e) => { e.stopPropagation(); openEditUserDialog(user); }}
                                  title="Редактировать"
                                >
                                  ✏️
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Детали выбранного пользователя */}
          {selectedUser && (
            <div className="user-details-panel">
              <h2>Информация о пользователе</h2>
              <div className="user-info">
                <div className="user-info-row">
                  <span className="label">Имя:</span>
                  <span className="value">{selectedUser.name}</span>
                </div>
                <div className="user-info-row">
                  <span className="label">Email:</span>
                  <span className="value">{selectedUser.email}</span>
                </div>
                <div className="user-info-row">
                  <span className="label">Телефон:</span>
                  <span className="value">{selectedUser.phone || '—'}</span>
                </div>
                <div className="user-info-row">
                  <span className="label">Роль:</span>
                  <span className="value">{getRoleLabel(selectedUser.role)}</span>
                </div>
              </div>

              <h3>Сети</h3>
              <div className="networks-list">
                {networks.map(network => (
                  <div
                    key={network.network_id}
                    className={`network-card ${selectedNetwork?.network_id === network.network_id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedNetwork(network);
                      setSelectedBranch(null);
                    }}
                  >
                    <div className="network-name">{network.name}</div>
                    <div className="network-description">{network.description}</div>
                  </div>
                ))}
              </div>

              <div className="section-header">
                <h3>Филиалы</h3>
                <button
                  className="btn btn-small btn-primary"
                  onClick={() => openAddBranchForUser(selectedUser)}
                  title="Добавить филиал"
                >
                  + Добавить
                </button>
              </div>
              <div className="branches-list">
                {branches.map(branch => (
                  <div
                    key={branch.branch_id}
                    className={`branch-card ${selectedBranch?.branch_id === branch.branch_id ? 'active' : ''}`}
                    onClick={() => setSelectedBranch(branch)}
                  >
                    <div className="branch-header">
                      <div className="branch-name">{branch.branch_name}</div>
                      <div className="branch-actions">
                        <button
                          className="btn btn-small"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditBranchDialog(branch);
                          }}
                          title="Редактировать"
                        >
                          ✏️
                        </button>
                        {currentUser?.role === 'admin' && (
                          <button
                            className="btn btn-small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGoToBranch(branch.branch_id);
                            }}
                          >
                            Перейти
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="branch-info">
                      {branch.category && (
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                          {branch.category === 'VR' ? '🎮 VR Арена' : branch.category === 'Бильярд' ? '🎱 Бильярд' : branch.category === 'Техосмотр' ? '🔧 Техосмотр' : branch.category}
                        </div>
                      )}
                      <div>{branch.city}</div>
                      <div>{branch.address}</div>
                      <div>{branch.phone}</div>
                      {branch.license_status && (
                        <div className="branch-license">
                          <span className={`license-badge ${branch.license_status}`}>
                            {branch.license_status === 'free_trial' ? '🎁 Бесплатный период' : '💎 Платная лицензия'}
                          </span>
                          {branch.valid_until && (
                            <span className="license-date">
                              до {new Date(branch.valid_until).toLocaleDateString('ru-RU')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Диалог добавления пользователя */}
        {showAddUserDialog && (
          <div className="dialog-overlay" onClick={() => setShowAddUserDialog(false)}>
            <div className="dialog" onClick={(e) => e.stopPropagation()}>
              <h2>Добавить пользователя</h2>
              <form onSubmit={handleAddUser}>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Пароль *</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Имя</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Телефон</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Роль</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    <option value="user">Пользователь</option>
                    <option value="vip-user">VIP Пользователь</option>
                    {currentUser?.role === 'admin' && (
                      <option value="manager">Менеджер</option>
                    )}
                  </select>
                </div>
                <div className="dialog-actions">
                  <button type="button" className="btn" onClick={() => setShowAddUserDialog(false)}>
                    Отмена
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Создать
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Диалог редактирования пользователя */}
        {showEditUserDialog && (
          <div className="dialog-overlay" onClick={() => setShowEditUserDialog(false)}>
            <div className="dialog" onClick={(e) => e.stopPropagation()}>
              <h2>Редактировать пользователя</h2>
              <form onSubmit={handleUpdateUser}>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={editUser.email}
                    onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Имя</label>
                  <input
                    type="text"
                    value={editUser.name}
                    onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Телефон</label>
                  <input
                    type="tel"
                    value={editUser.phone}
                    onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Роль</label>
                  <select
                    value={editUser.role}
                    onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                  >
                    <option value="user">Пользователь</option>
                    <option value="vip-user">VIP Пользователь</option>
                    {currentUser?.role === 'admin' && (
                      <option value="manager">Менеджер</option>
                    )}
                  </select>
                </div>
                <div className="dialog-actions">
                  <button type="button" className="btn" onClick={() => setShowEditUserDialog(false)}>
                    Отмена
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Сохранить
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Диалог добавления филиала (пошаговый) */}
        {showAddBranchDialog && (
          <div className="dialog-overlay" onClick={() => setShowAddBranchDialog(false)}>
            <div className="dialog dialog-large" onClick={(e) => e.stopPropagation()}>
              <h2>Добавить филиал - Шаг {branchCreationStep} из 3</h2>
              
              {/* Шаг 1: Выбор пользователя */}
              {branchCreationStep === 1 && (
                <div>
                  <h3>Выберите пользователя</h3>
                  <div className="form-group">
                    <select
                      value={selectedUserForBranch?.id || ''}
                      onChange={(e) => {
                        const user = users.find(u => u.id === parseInt(e.target.value));
                        setSelectedUserForBranch(user);
                      }}
                    >
                      <option value="">-- Выберите пользователя --</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name || user.email} ({getRoleLabel(user.role)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="dialog-actions">
                    <button type="button" className="btn" onClick={() => setShowAddBranchDialog(false)}>
                      Отмена
                    </button>
                    <button type="button" className="btn btn-primary" onClick={handleNextStep}>
                      Далее
                    </button>
                  </div>
                </div>
              )}

              {/* Шаг 2: Выбор или создание сети */}
              {branchCreationStep === 2 && (
                <div>
                  <h3>Выберите сеть для пользователя: {selectedUserForBranch?.name || selectedUserForBranch?.email}</h3>
                  
                  <div className="form-group radio-row">
                    <label className="radio-option">
                      <input
                        type="radio"
                        checked={!createNewNetwork}
                        onChange={() => setCreateNewNetwork(false)}
                      />
                      {' '}Выбрать существующую сеть
                    </label>

                    <label className="radio-option">
                      <input
                        type="radio"
                        checked={createNewNetwork}
                        onChange={() => setCreateNewNetwork(true)}
                      />
                      {' '}Создать новую сеть
                    </label>
                  </div>

                  {!createNewNetwork && (
                    <div className="form-group">
                      <select
                        value={selectedNetworkForBranch?.network_id || ''}
                        onChange={(e) => {
                          const network = networks.find(n => n.network_id === parseInt(e.target.value));
                          setSelectedNetworkForBranch(network);
                        }}
                      >
                        <option value="">-- Выберите сеть --</option>
                        {networks.map(network => (
                          <option key={network.network_id} value={network.network_id}>
                            {network.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {createNewNetwork && (
                    <>
                      <div className="form-group">
                        <label>Название сети *</label>
                        <input
                          type="text"
                          value={newNetwork.name}
                          onChange={(e) => setNewNetwork({ ...newNetwork, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Название (для URL)</label>
                        <input
                          type="text"
                          value={newNetwork.slug}
                          onChange={(e) => setNewNetwork({ ...newNetwork, slug: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Описание</label>
                        <textarea
                          value={newNetwork.description}
                          onChange={(e) => setNewNetwork({ ...newNetwork, description: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  <div className="dialog-actions">
                    <button type="button" className="btn" onClick={() => setBranchCreationStep(1)}>
                      Назад
                    </button>
                    <button type="button" className="btn btn-primary" onClick={handleNextStep}>
                      Далее
                    </button>
                  </div>
                </div>
              )}

              {/* Шаг 3: Создание филиала */}
              {branchCreationStep === 3 && (
                <form onSubmit={handleCreateBranch}>
                  <h3>Создать филиал</h3>
                  
                  <div className="form-group">
                    <label>Название филиала *</label>
                    <input
                      type="text"
                      value={newBranch.branchName}
                      onChange={(e) => setNewBranch({ ...newBranch, branchName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Город</label>
                    <input
                      type="text"
                      value={newBranch.city}
                      onChange={(e) => setNewBranch({ ...newBranch, city: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Адрес</label>
                    <input
                      type="text"
                      value={newBranch.address}
                      onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Телефон</label>
                    <input
                      type="tel"
                      value={newBranch.phone}
                      onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Статус лицензии</label>
                    <select
                      value={newBranch.licenseStatus}
                      onChange={(e) => setNewBranch({ ...newBranch, licenseStatus: e.target.value })}
                    >
                      <option value="free_trial">Бесплатный период</option>
                      <option value="paid">Платная лицензия</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Действительно с</label>
                    <input
                      type="date"
                      value={newBranch.validFrom}
                      onChange={(e) => setNewBranch({ ...newBranch, validFrom: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Действительно до</label>
                    <input
                      type="date"
                      value={newBranch.validUntil}
                      onChange={(e) => setNewBranch({ ...newBranch, validUntil: e.target.value })}
                    />
                  </div>

                  <div className="dialog-actions">
                    <button type="button" className="btn" onClick={() => setBranchCreationStep(2)}>
                      Назад
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Создать филиал
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Диалог редактирования филиала */}
        {showEditBranchDialog && (
          <div className="dialog-overlay" onClick={() => setShowEditBranchDialog(false)}>
            <div className="dialog" onClick={(e) => e.stopPropagation()}>
              <h2>Редактировать филиал</h2>
              <form onSubmit={handleUpdateBranch}>
                <div className="form-group">
                  <label>Название филиала *</label>
                  <input
                    type="text"
                    value={editBranch.branchName}
                    onChange={(e) => setEditBranch({ ...editBranch, branchName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Категория филиала *</label>
                  <select
                    value={editBranch.category}
                    onChange={(e) => setEditBranch({ ...editBranch, category: e.target.value })}
                    required
                  >
                    <option value="">Выберите категорию</option>
                    <option value="VR">🎮 VR Арена</option>
                    <option value="Бильярд">🎱 Бильярд</option>
                    <option value="Техосмотр">🔧 Техосмотр</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Город</label>
                  <input
                    type="text"
                    value={editBranch.city}
                    onChange={(e) => setEditBranch({ ...editBranch, city: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Адрес</label>
                  <input
                    type="text"
                    value={editBranch.address}
                    onChange={(e) => setEditBranch({ ...editBranch, address: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Телефон</label>
                  <input
                    type="tel"
                    value={editBranch.phone}
                    onChange={(e) => setEditBranch({ ...editBranch, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Статус лицензии</label>
                  <select
                    value={editBranch.licenseStatus}
                    onChange={(e) => setEditBranch({ ...editBranch, licenseStatus: e.target.value })}
                  >
                    <option value="free_trial">Бесплатный период</option>
                    <option value="paid">Платная лицензия</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Действительно с</label>
                  <input
                    type="date"
                    value={editBranch.validFrom}
                    onChange={(e) => setEditBranch({ ...editBranch, validFrom: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Действительно до</label>
                  <input
                    type="date"
                    value={editBranch.validUntil}
                    onChange={(e) => setEditBranch({ ...editBranch, validUntil: e.target.value })}
                  />
                </div>

                <div className="dialog-actions">
                  <button type="button" className="btn" onClick={() => setShowEditBranchDialog(false)}>
                    Отмена
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Сохранить
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
