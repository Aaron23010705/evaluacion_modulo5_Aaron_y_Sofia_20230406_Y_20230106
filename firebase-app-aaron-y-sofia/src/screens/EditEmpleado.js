import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView, ToastAndroid, Platform } from 'react-native';
import { auth, database } from '../config/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Componente EditProfileScreen para editar información del usuario autenticado
const EditProfileScreen = ({ navigation, route }) => {
    // Estado inicial del usuario
    const [usuario, setUsuario] = useState({
        nombre: '',
        correo: '',
        edad: '',
        especialidad: '',
        contraseñaNueva: '',
        confirmarContraseña: ''
    });

    const [loading, setLoading] = useState(false);
    const [cargandoDatos, setCargandoDatos] = useState(true);
    const [mostrarContraseña, setMostrarContraseña] = useState(false);
    const [mostrarConfirmarContraseña, setMostrarConfirmarContraseña] = useState(false);

    // Cargar datos del usuario al iniciar
    useEffect(() => {
        cargarDatosUsuario();
    }, []);

    // Función para cargar los datos actuales del usuario
    const cargarDatosUsuario = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                // Obtener datos desde Firestore
                const userDoc = await getDoc(doc(database, 'usuarios', user.uid));
                
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUsuario({
                        nombre: userData.nombre || user.displayName || '',
                        correo: userData.correo || user.email || '',
                        edad: userData.edad ? userData.edad.toString() : '',
                        especialidad: userData.especialidad || '',
                        contraseñaNueva: '',
                        confirmarContraseña: ''
                    });
                } else {
                    // Si no hay datos en Firestore, usar datos de Auth
                    setUsuario({
                        nombre: user.displayName || '',
                        correo: user.email || '',
                        edad: '',
                        especialidad: '',
                        contraseñaNueva: '',
                        confirmarContraseña: ''
                    });
                }
            }
        } catch (error) {
            console.error('Error al cargar datos del usuario:', error);
            Alert.alert('Error', 'No se pudieron cargar los datos del usuario');
        } finally {
            setCargandoDatos(false);
        }
    };

    // Función para navegar de regreso al Home
    const goToHome = () => {
        navigation.goBack();
    };

    // Función para validar los campos obligatorios
    const validarCampos = () => {
        if (!usuario.nombre.trim()) {
            Alert.alert('Error', 'El nombre es obligatorio');
            return false;
        }
        if (!usuario.correo.trim()) {
            Alert.alert('Error', 'El correo electrónico es obligatorio');
            return false;
        }
        if (!usuario.edad.trim()) {
            Alert.alert('Error', 'La edad es obligatoria');
            return false;
        }
        if (!usuario.especialidad.trim()) {
            Alert.alert('Error', 'La especialidad es obligatoria');
            return false;
        }
        
        // Validar formato de correo electrónico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(usuario.correo)) {
            Alert.alert('Error', 'Por favor ingresa un correo electrónico válido');
            return false;
        }

        // Validar que la edad sea un número válido
        const edad = parseInt(usuario.edad);
        if (isNaN(edad) || edad < 18 || edad > 100) {
            Alert.alert('Error', 'Por favor ingresa una edad válida (18-100 años)');
            return false;
        }

        // Validar contraseña si se proporciona
        if (usuario.contraseñaNueva.trim() !== '') {
            if (usuario.contraseñaNueva.length < 6) {
                Alert.alert('Error', 'La nueva contraseña debe tener al menos 6 caracteres');
                return false;
            }
            if (usuario.contraseñaNueva !== usuario.confirmarContraseña) {
                Alert.alert('Error', 'Las contraseñas no coinciden');
                return false;
            }
        }

        return true;
    };

    // Función para mostrar toast
    const showToast = (message) => {
        if (Platform.OS === 'android') {
            ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
            Alert.alert('Éxito', message);
        }
    };

    // Función para actualizar el perfil del usuario
    const actualizarPerfil = async () => {
        if (!validarCampos()) {
            return;
        }

        setLoading(true);

        try {
            const user = auth.currentUser;
            if (!user) {
                Alert.alert('Error', 'No hay usuario autenticado');
                setLoading(false);
                return;
            }

            // 1. Actualizar el displayName en Firebase Auth
            await updateProfile(user, {
                displayName: usuario.nombre.trim()
            });

            // 2. Actualizar email si ha cambiado
            if (usuario.correo !== user.email) {
                await updateEmail(user, usuario.correo.trim());
            }

            // 3. Actualizar contraseña si se proporcionó una nueva
            if (usuario.contraseñaNueva.trim() !== '') {
                await updatePassword(user, usuario.contraseñaNueva);
            }

            // 4. Actualizar datos en Firestore
            const usuarioActualizado = {
                nombre: usuario.nombre.trim(),
                correo: usuario.correo.trim().toLowerCase(),
                edad: parseInt(usuario.edad),
                especialidad: usuario.especialidad.trim(),
                fechaModificacion: new Date()
            };

            await updateDoc(doc(database, 'usuarios', user.uid), usuarioActualizado);
            
            console.log('Perfil de usuario actualizado');
            
            // Mostrar mensaje de éxito
            showToast('Perfil actualizado correctamente');
            
            // Limpiar campos de contraseña
            setUsuario({
                ...usuario,
                contraseñaNueva: '',
                confirmarContraseña: ''
            });

            // Redirigir al home después de un breve delay
            setTimeout(() => {
                goToHome();
            }, 1500);
            
        } catch (error) {
            console.error('Error al actualizar el perfil:', error);
            
            // Manejar errores específicos
            let errorMessage = 'Ocurrió un error al actualizar el perfil';
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Este correo electrónico ya está en uso';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'El correo electrónico no es válido';
                    break;
                case 'auth/requires-recent-login':
                    errorMessage = 'Por seguridad, debes iniciar sesión nuevamente antes de cambiar datos sensibles';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'La nueva contraseña es muy débil';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Error de conexión. Verifica tu internet';
                    break;
                default:
                    errorMessage = 'Error: ' + error.message;
            }
            
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Función para confirmar la cancelación de la edición
    const confirmarCancelacion = () => {
        Alert.alert(
            'Confirmar cancelación',
            '¿Estás seguro de que deseas cancelar? Se perderán los cambios no guardados.',
            [
                {
                    text: 'Continuar editando',
                    style: 'cancel',
                },
                {
                    text: 'Cancelar',
                    style: 'destructive',
                    onPress: goToHome,
                },
            ]
        );
    };

    // Mostrar loading mientras se cargan los datos
    if (cargandoDatos) {
        return (
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Cargando información...</Text>
                </View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.formContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={goToHome}>
                            <Ionicons name="arrow-back" size={24} color="#667eea" />
                        </TouchableOpacity>
                        <View style={styles.headerContent}>
                            <Text style={styles.title}>Editar Perfil</Text>
                            <Text style={styles.subtitle}>Actualiza tu información personal</Text>
                        </View>
                    </View>
                    
                    {/* Formulario */}
                    <View style={styles.form}>
                        {/* Campo Nombre */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Nombre Completo *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ingresa tu nombre completo"
                                placeholderTextColor="#999"
                                onChangeText={text => setUsuario({ ...usuario, nombre: text })}
                                value={usuario.nombre}
                                editable={!loading}
                            />
                        </View>

                        {/* Campo Correo Electrónico */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Correo Electrónico *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="correo@ejemplo.com"
                                placeholderTextColor="#999"
                                onChangeText={text => setUsuario({ ...usuario, correo: text })}
                                value={usuario.correo}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                editable={!loading}
                            />
                        </View>

                        {/* Campo Edad */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Edad *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Tu edad (18-100)"
                                placeholderTextColor="#999"
                                onChangeText={text => setUsuario({ ...usuario, edad: text })}
                                value={usuario.edad}
                                keyboardType="numeric"
                                editable={!loading}
                            />
                        </View>

                        {/* Campo Especialidad */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Especialidad *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ej: Desarrollo, Marketing, Diseño"
                                placeholderTextColor="#999"
                                onChangeText={text => setUsuario({ ...usuario, especialidad: text })}
                                value={usuario.especialidad}
                                editable={!loading}
                            />
                        </View>

                        {/* Separador */}
                        <View style={styles.separador}>
                            <Text style={styles.separadorText}>Cambiar Contraseña (Opcional)</Text>
                        </View>

                        {/* Campo Nueva Contraseña */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Nueva Contraseña</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Deja vacío para mantener actual"
                                    placeholderTextColor="#999"
                                    onChangeText={text => setUsuario({ ...usuario, contraseñaNueva: text })}
                                    value={usuario.contraseñaNueva}
                                    secureTextEntry={!mostrarContraseña}
                                    editable={!loading}
                                />
                                <TouchableOpacity 
                                    style={styles.eyeButton}
                                    onPress={() => setMostrarContraseña(!mostrarContraseña)}
                                >
                                    <Ionicons 
                                        name={mostrarContraseña ? "eye-off" : "eye"} 
                                        size={24} 
                                        color="#666" 
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Campo Confirmar Nueva Contraseña */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Confirmar Nueva Contraseña</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Confirma la nueva contraseña"
                                    placeholderTextColor="#999"
                                    onChangeText={text => setUsuario({ ...usuario, confirmarContraseña: text })}
                                    value={usuario.confirmarContraseña}
                                    secureTextEntry={!mostrarConfirmarContraseña}
                                    editable={!loading}
                                />
                                <TouchableOpacity 
                                    style={styles.eyeButton}
                                    onPress={() => setMostrarConfirmarContraseña(!mostrarConfirmarContraseña)}
                                >
                                    <Ionicons 
                                        name={mostrarConfirmarContraseña ? "eye-off" : "eye"} 
                                        size={24} 
                                        color="#666" 
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Botón de Actualizar */}
                        <TouchableOpacity 
                            style={[styles.primaryButton, loading && styles.buttonDisabled]} 
                            onPress={actualizarPerfil}
                            disabled={loading}
                        >
                            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={styles.buttonIcon} />
                            <Text style={styles.buttonText}>
                                {loading ? 'Actualizando...' : 'Actualizar Perfil'}
                            </Text>
                        </TouchableOpacity>

                        {/* Botón de Cancelar */}
                        <TouchableOpacity 
                            style={styles.secondaryButton} 
                            onPress={confirmarCancelacion}
                            disabled={loading}
                        >
                            <Ionicons name="close-circle-outline" size={20} color="#667eea" style={styles.buttonIcon} />
                            <Text style={styles.secondaryButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
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
    formContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        padding: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    headerContent: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: '#333',
        fontWeight: '600',
    },
    input: {
        height: 50,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        fontSize: 16,
        color: '#333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 10,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    passwordInput: {
        flex: 1,
        height: 50,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#333',
    },
    eyeButton: {
        padding: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    separador: {
        marginVertical: 20,
        paddingVertical: 15,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    separadorText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#667eea',
        textAlign: 'center',
    },
    primaryButton: {
        backgroundColor: '#667eea',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        borderRadius: 10,
        marginTop: 20,
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
        borderRadius: 10,
        marginTop: 12,
        borderWidth: 2,
        borderColor: '#667eea',
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
        shadowOpacity: 0.1,
    },
    buttonIcon: {
        marginRight: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    secondaryButtonText: {
        color: '#667eea',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default EditProfileScreen;