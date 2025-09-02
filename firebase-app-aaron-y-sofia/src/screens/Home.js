import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { auth, database } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = ({ navigation }) => {
    // Estado para la información del usuario
    const [usuario, setUsuario] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [errorConexion, setErrorConexion] = useState(false);

    // Obtener información del usuario al cargar la pantalla
    useEffect(() => {
        obtenerInformacionUsuario();
    }, []);

    // Función para obtener la información del usuario desde Firestore
    const obtenerInformacionUsuario = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                console.log('Usuario autenticado:', user.uid);
                
                // Primero establecer datos básicos de Auth inmediatamente
                const datosBasicos = {
                    uid: user.uid,
                    nombre: user.displayName || 'Usuario',
                    correo: user.email,
                    edad: 'Cargando...',
                    especialidad: 'Cargando...',
                    fechaRegistro: null
                };
                setUsuario(datosBasicos);
                setCargando(false); // Mostrar la pantalla inmediatamente con datos básicos
                
                // Luego intentar obtener datos adicionales de Firestore en segundo plano
                try {
                    console.log('Intentando obtener datos adicionales de Firestore...');
                    
                    // Timeout para evitar esperas largas
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout')), 5000)
                    );
                    
                    const firestorePromise = getDoc(doc(database, 'usuarios', user.uid));
                    
                    const userDoc = await Promise.race([firestorePromise, timeoutPromise]);
                    
                    if (userDoc.exists()) {
                        console.log('Documento encontrado en Firestore');
                        const userData = userDoc.data();
                        setUsuario(prevUser => ({
                            ...prevUser,
                            nombre: userData.nombre || user.displayName || 'Usuario',
                            correo: userData.correo || user.email,
                            edad: userData.edad || 'No especificada',
                            especialidad: userData.especialidad || 'No especificada',
                            fechaRegistro: userData.fechaRegistro
                        }));
                        setErrorConexion(false);
                        console.log('Datos actualizados desde Firestore');
                    } else {
                        console.log('Documento no encontrado en Firestore');
                        setUsuario(prevUser => ({
                            ...prevUser,
                            edad: 'No especificada',
                            especialidad: 'No especificada'
                        }));
                    }
                } catch (firestoreError) {
                    console.error('Error de Firestore:', firestoreError);
                    
                    // Actualizar con datos por defecto si Firestore falla
                    setUsuario(prevUser => ({
                        ...prevUser,
                        edad: 'No disponible (sin conexión)',
                        especialidad: 'No disponible (sin conexión)'
                    }));
                    setErrorConexion(true);
                    console.log('Firestore no disponible, manteniendo datos básicos de Auth');
                }
            } else {
                console.log('No hay usuario autenticado');
                // No navegues manualmente aquí, el Navigation component lo manejará
            }
        } catch (error) {
            console.error('Error general al obtener información del usuario:', error);
            setCargando(false);
            Alert.alert('Error', 'No se pudo cargar la información del usuario');
        }
    };

    // Función para reintentar la conexión
    const reintentarConexion = () => {
        setCargando(true);
        setErrorConexion(false);
        obtenerInformacionUsuario();
    };

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
                            // No necesitas navigate porque el Navigation component
                            // manejará automáticamente el cambio cuando user sea null
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
        navigation.navigate('EditProfile', { usuario });
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

    // Mostrar loading mientras se cargan los datos
    if (cargando) {
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
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {/* Indicador de error de conexión */}
                {errorConexion && (
                    <View style={styles.errorBanner}>
                        <Ionicons name="warning-outline" size={20} color="#ff9800" />
                        <Text style={styles.errorBannerText}>
                            Conexión limitada - Mostrando datos básicos
                        </Text>
                        <TouchableOpacity onPress={reintentarConexion} style={styles.retryButton}>
                            <Text style={styles.retryButtonText}>Reintentar</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Header con bienvenida */}
                <View style={styles.header}>
                    <View style={styles.welcomeContainer}>
                        <Text style={styles.welcomeText}>¡Bienvenido!</Text>
                        <Text style={styles.userName}>{usuario?.nombre}</Text>
                    </View>
                    <TouchableOpacity style={styles.logoutButton} onPress={cerrarSesion}>
                        <Ionicons name="log-out-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Tarjeta de información del usuario */}
                <View style={styles.userCard}>
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
                                <Text style={styles.infoValue}>{usuario?.edad} años</Text>
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
                        ¡Gracias por usar nuestra aplicación! 🎉
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
    },
});

export default HomeScreen;