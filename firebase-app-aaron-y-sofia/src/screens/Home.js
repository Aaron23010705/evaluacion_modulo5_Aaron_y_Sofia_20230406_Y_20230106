import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { auth, database } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const HomeScreen = ({ navigation }) => {
    // Estado para la información del usuario
    const [usuario, setUsuario] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errorConexion, setErrorConexion] = useState(false);

    // 🔄 FUNCIÓN PRINCIPAL PARA OBTENER INFORMACIÓN (OPTIMIZADA)
    const obtenerInformacionUsuario = useCallback(async (mostrarLoader = true) => {
        try {
            if (mostrarLoader) {
                setCargando(true);
            }

            const user = auth.currentUser;
            if (user) {
                console.log('🔄 Actualizando información del usuario:', user.uid);
                
                // Datos básicos inmediatos de Auth
                const datosBasicos = {
                    uid: user.uid,
                    nombre: user.displayName || 'Usuario',
                    correo: user.email,
                    edad: 'Cargando...',
                    especialidad: 'Cargando...',
                    fechaRegistro: null
                };
                
                setUsuario(datosBasicos);
                if (mostrarLoader) {
                    setCargando(false);
                }
                
                // Obtener datos adicionales de Firestore
                try {
                    console.log('📊 Obteniendo datos completos de Firestore...');
                    
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout')), 8000)
                    );
                    
                    const firestorePromise = getDoc(doc(database, 'usuarios', user.uid));
                    const userDoc = await Promise.race([firestorePromise, timeoutPromise]);
                    
                    if (userDoc.exists()) {
                        console.log('✅ Datos actualizados desde Firestore');
                        const userData = userDoc.data();
                        
                        // Actualizar con todos los datos de Firestore
                        const datosCompletos = {
                            uid: user.uid,
                            nombre: userData.nombre || user.displayName || 'Usuario',
                            correo: userData.correo || user.email,
                            edad: userData.edad || 'No especificada',
                            especialidad: userData.especialidad || 'No especificada',
                            fechaRegistro: userData.fechaRegistro,
                            // Datos adicionales útiles
                            activo: userData.activo,
                            plataforma: userData.plataforma,
                            ultimaActualizacion: userData.ultimaActualizacion,
                            version: userData.version
                        };
                        
                        setUsuario(datosCompletos);
                        setErrorConexion(false);
                        
                        console.log('📋 Información completa cargada:', {
                            nombre: datosCompletos.nombre,
                            correo: datosCompletos.correo,
                            edad: datosCompletos.edad,
                            especialidad: datosCompletos.especialidad
                        });
                        
                    } else {
                        console.log('⚠️ Documento no encontrado en Firestore');
                        setUsuario(prevUser => ({
                            ...prevUser,
                            edad: 'No registrada',
                            especialidad: 'No registrada'
                        }));
                        // Opcional: Mostrar alerta para completar perfil
                        Alert.alert(
                            'Perfil Incompleto',
                            'No se encontró información adicional. ¿Deseas completar tu perfil?',
                            [
                                { text: 'Más tarde', style: 'cancel' },
                                { text: 'Completar', onPress: () => editarPerfil() }
                            ]
                        );
                    }
                } catch (firestoreError) {
                    console.error('❌ Error de Firestore:', firestoreError.message);
                    
                    setUsuario(prevUser => ({
                        ...prevUser,
                        edad: 'No disponible (sin conexión)',
                        especialidad: 'No disponible (sin conexión)'
                    }));
                    setErrorConexion(true);
                }
            } else {
                console.log('⚠️ No hay usuario autenticado');
            }
        } catch (error) {
            console.error('❌ Error general:', error);
            Alert.alert('Error', 'No se pudo cargar la información del usuario');
        } finally {
            setCargando(false);
            setRefreshing(false);
        }
    }, []);

    // 🎯 USAR useFocusEffect PARA RECARGAR AL VOLVER A LA PANTALLA
    useFocusEffect(
        useCallback(() => {
            console.log('🎯 Pantalla enfocada - Recargando información...');
            obtenerInformacionUsuario(false); // No mostrar loader al regresar
        }, [obtenerInformacionUsuario])
    );

    // 🔄 CARGAR INFORMACIÓN AL MONTAR COMPONENTE
    useEffect(() => {
        console.log('🚀 Componente montado - Carga inicial');
        obtenerInformacionUsuario(true);
    }, [obtenerInformacionUsuario]);

    // 🔄 FUNCIÓN PARA PULL-TO-REFRESH
    const onRefresh = useCallback(async () => {
        console.log('🔄 Pull-to-refresh activado');
        setRefreshing(true);
        await obtenerInformacionUsuario(false);
    }, [obtenerInformacionUsuario]);

    // 🔄 FUNCIÓN PARA REINTENTAR CONEXIÓN
    const reintentarConexion = useCallback(() => {
        console.log('🔁 Reintentando conexión...');
        setErrorConexion(false);
        obtenerInformacionUsuario(true);
    }, [obtenerInformacionUsuario]);

    // 🔄 FUNCIÓN PÚBLICA PARA FORZAR ACTUALIZACIÓN (llamable desde otras pantallas)
    const actualizarInformacion = useCallback(() => {
        console.log('🔄 Actualización forzada solicitada');
        obtenerInformacionUsuario(false);
    }, [obtenerInformacionUsuario]);

    // Exponer función para que otras pantallas puedan llamarla
    React.useEffect(() => {
        navigation.setParams({ actualizarInformacion });
    }, [navigation, actualizarInformacion]);

    // Función para cerrar sesión
    const cerrarSesion = () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro que deseas cerrar sesión?',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Cerrar Sesión',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut(auth);
                        } catch (error) {
                            console.error('Error al cerrar sesión:', error);
                            Alert.alert('Error', 'No se pudo cerrar la sesión');
                        }
                    },
                },
            ]
        );
    };

    // Función para navegar a la pantalla de edición
    const editarPerfil = () => {
        navigation.navigate('EditProfile', { 
            usuario,
            onUpdate: () => {
                // Callback para actualizar cuando se edite el perfil
                console.log('🔄 Perfil editado - Actualizando información...');
                obtenerInformacionUsuario(false);
            }
        });
    };

    // Función para formatear la fecha
    const formatearFecha = (fecha) => {
        if (!fecha) return 'No disponible';
        try {
            const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'No disponible';
        }
    };

    // Mostrar loading inicial
    if (cargando && !usuario) {
        return (
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>Cargando información...</Text>
                </View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
            <ScrollView 
                contentContainerStyle={styles.scrollContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#fff"
                        title="Actualizando información..."
                        titleColor="#fff"
                    />
                }
            >
                {/* Indicador de error de conexión */}
                {errorConexion && (
                    <View style={styles.errorBanner}>
                        <Ionicons name="warning-outline" size={20} color="#ff9800" />
                        <Text style={styles.errorBannerText}>
                            Conexión limitada - Datos parciales
                        </Text>
                        <TouchableOpacity onPress={reintentarConexion} style={styles.retryButton}>
                            <Text style={styles.retryButtonText}>Reintentar</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Header con bienvenida y botón refresh */}
                <View style={styles.header}>
                    <View style={styles.welcomeContainer}>
                        <Text style={styles.welcomeText}>¡Bienvenido!</Text>
                        <Text style={styles.userName}>{usuario?.nombre}</Text>
                    </View>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity 
                            style={styles.refreshButton} 
                            onPress={() => obtenerInformacionUsuario(false)}
                            disabled={refreshing}
                        >
                            <Ionicons 
                                name="refresh-outline" 
                                size={20} 
                                color="#fff" 
                                style={refreshing ? styles.rotating : null}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.logoutButton} onPress={cerrarSesion}>
                            <Ionicons name="log-out-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Tarjeta de información del usuario */}
                <View style={styles.userCard}>
                    {/* Indicador de carga para datos específicos */}
                    {(usuario?.edad === 'Cargando...' || usuario?.especialidad === 'Cargando...') && (
                        <View style={styles.loadingIndicator}>
                            <ActivityIndicator size="small" color="#667eea" />
                            <Text style={styles.loadingIndicatorText}>Actualizando datos...</Text>
                        </View>
                    )}

                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>
                            {usuario?.nombre ? usuario.nombre.charAt(0).toUpperCase() : 'U'}
                        </Text>
                    </View>

                    <View style={styles.userInfo}>
                        <Text style={styles.userTitle}>Mi Información</Text>
                        
                        <View style={styles.infoRow}>
                            <Ionicons name="person-outline" size={20} color="#667eea" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Nombre Completo</Text>
                                <Text style={styles.infoValue}>{usuario?.nombre}</Text>
                            </View>
                        </View>

                        <View style={styles.infoRow}>
                            <Ionicons name="mail-outline" size={20} color="#667eea" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Correo Electrónico</Text>
                                <Text style={styles.infoValue}>{usuario?.correo}</Text>
                            </View>
                        </View>

                        <View style={styles.infoRow}>
                            <Ionicons name="calendar-outline" size={20} color="#667eea" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Edad</Text>
                                <Text style={styles.infoValue}>
                                    {usuario?.edad === 'Cargando...' ? 'Cargando...' : `${usuario?.edad} años`}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.infoRow}>
                            <Ionicons name="briefcase-outline" size={20} color="#667eea" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Especialidad</Text>
                                <Text style={styles.infoValue}>{usuario?.especialidad}</Text>
                            </View>
                        </View>

                        <View style={styles.infoRow}>
                            <Ionicons name="time-outline" size={20} color="#667eea" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Fecha de Registro</Text>
                                <Text style={styles.infoValue}>{formatearFecha(usuario?.fechaRegistro)}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Botones de acción */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={styles.primaryButton} onPress={editarPerfil}>
                        <Ionicons name="create-outline" size={20} color="#fff" style={styles.buttonIcon} />
                        <Text style={styles.buttonText}>Editar Perfil</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryButton} onPress={cerrarSesion}>
                        <Ionicons name="log-out-outline" size={20} color="#667eea" style={styles.buttonIcon} />
                        <Text style={styles.secondaryButtonText}>Cerrar Sesión</Text>
                    </TouchableOpacity>
                </View>

                {/* Información adicional */}
                <View style={styles.extraInfo}>
                    <Text style={styles.extraInfoText}>
                        Desliza hacia abajo para actualizar tu información
                    </Text>
                    <Text style={styles.extraInfoSubtext}>
                        Última actualización: {new Date().toLocaleTimeString()}
                    </Text>
                </View>
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
        paddingTop: 50,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 10,
    },
    loadingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderRadius: 8,
        marginBottom: 12,
    },
    loadingIndicatorText: {
        marginLeft: 8,
        color: '#667eea',
        fontSize: 12,
        fontWeight: '500',
    },
    errorBanner: {
        backgroundColor: 'rgba(255, 152, 0, 0.9)',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    errorBannerText: {
        flex: 1,
        color: '#fff',
        fontSize: 14,
        marginLeft: 8,
        fontWeight: '500',
    },
    retryButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    welcomeContainer: {
        flex: 1,
    },
    welcomeText: {
        fontSize: 18,
        color: '#fff',
        opacity: 0.9,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 4,
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    refreshButton: {
        padding: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        marginRight: 8,
    },
    rotating: {
        transform: [{ rotate: '360deg' }],
    },
    logoutButton: {
        padding: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    userCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        padding: 25,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    userInfo: {
        width: '100%',
    },
    userTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
        paddingVertical: 8,
    },
    infoContent: {
        flex: 1,
        marginLeft: 12,
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
    },
    actionsContainer: {
        marginBottom: 20,
    },
    primaryButton: {
        backgroundColor: '#667eea',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    secondaryButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#667eea',
    },
    buttonIcon: {
        marginRight: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButtonText: {
        color: '#667eea',
        fontSize: 16,
        fontWeight: 'bold',
    },
    extraInfo: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    extraInfoText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '500',
        marginBottom: 4,
    },
    extraInfoSubtext: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 12,
        textAlign: 'center',
    },
});

export default HomeScreen;