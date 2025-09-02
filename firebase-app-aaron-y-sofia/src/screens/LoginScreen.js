import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView, ToastAndroid, Platform } from 'react-native';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }) => {
    // Estado para los datos del login
    const [credenciales, setCredenciales] = useState({
        correo: '',
        contraseña: ''
    });

    // Estado para mostrar/ocultar contraseña
    const [mostrarContraseña, setMostrarContraseña] = useState(false);
    
    // Estado de carga
    const [cargando, setCargando] = useState(false);

    // Función para navegar al registro
    const goToRegister = () => {
        navigation.navigate('Register');
    };

    // Función para validar los campos
    const validarCampos = () => {
        // Validar campos obligatorios
        if (!credenciales.correo.trim()) {
            Alert.alert('Error', 'El correo electrónico es obligatorio');
            return false;
        }
        if (!credenciales.contraseña.trim()) {
            Alert.alert('Error', 'La contraseña es obligatoria');
            return false;
        }
        
        // Validar formato de correo electrónico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(credenciales.correo)) {
            Alert.alert('Error', 'Por favor ingresa un correo electrónico válido');
            return false;
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

    // Función para iniciar sesión
    const iniciarSesion = async () => {
        if (!validarCampos()) {
            return;
        }

        setCargando(true);

        try {
            // Iniciar sesión con Firebase Auth
            const userCredential = await signInWithEmailAndPassword(
                auth, 
                credenciales.correo, 
                credenciales.contraseña
            );
            
            const user = userCredential.user;
            console.log('Usuario logueado:', user.uid);
            
            // Mostrar mensaje de éxito
            showToast('¡Bienvenido de vuelta!');
            
            // Limpiar formulario
            setCredenciales({
                correo: '',
                contraseña: ''
            });

            // Navegar al Home después de un breve delay
            setTimeout(() => {
                navigation.replace('Home');
            }, 1000);
            
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            
            // Manejar errores específicos de Firebase Auth
            let errorMessage = 'Ocurrió un error al iniciar sesión';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'No existe una cuenta con este correo electrónico';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Contraseña incorrecta';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'El correo electrónico no es válido';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'Esta cuenta ha sido deshabilitada';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Demasiados intentos fallidos. Intenta más tarde';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Error de conexión. Verifica tu internet';
                    break;
                case 'auth/invalid-credential':
                    errorMessage = 'Credenciales inválidas. Verifica tu correo y contraseña';
                    break;
                default:
                    errorMessage = 'Error: ' + error.message;
            }
            
            Alert.alert('Error de Inicio de Sesión', errorMessage);
        } finally {
            setCargando(false);
        }
    };

    // Función para recuperar contraseña (opcional)
    const recuperarContraseña = () => {
        Alert.alert(
            'Recuperar Contraseña',
            'Esta funcionalidad se implementará en una versión futura',
            [{ text: 'OK' }]
        );
    };

    return (
        <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.formContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Text style={styles.logoIcon}>🔐</Text>
                        </View>
                        <Text style={styles.title}>Bienvenido</Text>
                        <Text style={styles.subtitle}>Inicia sesión en tu cuenta</Text>
                    </View>
                    
                    {/* Formulario */}
                    <View style={styles.form}>
                        {/* Campo Correo Electrónico */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Correo Electrónico</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="correo@ejemplo.com"
                                placeholderTextColor="#999"
                                onChangeText={text => setCredenciales({ ...credenciales, correo: text })}
                                value={credenciales.correo}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                editable={!cargando}
                            />
                        </View>

                        {/* Campo Contraseña */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Contraseña</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Tu contraseña"
                                    placeholderTextColor="#999"
                                    onChangeText={text => setCredenciales({ ...credenciales, contraseña: text })}
                                    value={credenciales.contraseña}
                                    secureTextEntry={!mostrarContraseña}
                                    editable={!cargando}
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

                        {/* Link Recuperar Contraseña */}
                        <TouchableOpacity style={styles.forgotPasswordContainer} onPress={recuperarContraseña}>
                            <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
                        </TouchableOpacity>

                        {/* Botón de Login */}
                        <TouchableOpacity 
                            style={[styles.primaryButton, cargando && styles.buttonDisabled]} 
                            onPress={iniciarSesion}
                            disabled={cargando}
                        >
                            <Text style={styles.buttonText}>
                                {cargando ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
                            </Text>
                        </TouchableOpacity>

                        {/* Link para ir al Registro */}
                        <TouchableOpacity style={styles.linkContainer} onPress={goToRegister}>
                            <Text style={styles.linkText}>
                                ¿No tienes cuenta? <Text style={styles.linkBold}>Regístrate</Text>
                            </Text>
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
        justifyContent: 'center',
        padding: 20,
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
        alignItems: 'center',
        marginBottom: 30,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    logoIcon: {
        fontSize: 36,
        color: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
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
    forgotPasswordContainer: {
        alignItems: 'flex-end',
        marginBottom: 20,
    },
    forgotPasswordText: {
        color: '#667eea',
        fontSize: 14,
        fontWeight: '500',
    },
    primaryButton: {
        backgroundColor: '#667eea',
        padding: 16,
        borderRadius: 10,
        marginTop: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
        shadowOpacity: 0.1,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
    linkContainer: {
        alignItems: 'center',
        marginTop: 24,
        padding: 10,
    },
    linkText: {
        color: '#666',
        fontSize: 16,
    },
    linkBold: {
        color: '#667eea',
        fontWeight: 'bold',
    },
});

export default LoginScreen;