import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView, ToastAndroid, Platform } from 'react-native';
import { auth, database } from '../config/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const RegisterScreen = ({ navigation }) => {
    // Estado para los datos del usuario
    const [usuario, setUsuario] = useState({
        nombre: '',
        correo: '',
        contraseña: '',
        confirmarContraseña: '',
        edad: '',
        especialidad: ''
    });

    // Estado para mostrar/ocultar contraseñas
    const [mostrarContraseña, setMostrarContraseña] = useState(false);
    const [mostrarConfirmarContraseña, setMostrarConfirmarContraseña] = useState(false);
    
    // Estado de carga
    const [cargando, setCargando] = useState(false);

    // Función para navegar al login
    const goToLogin = () => {
        navigation.navigate('Login');
    };

    // Función para validar los campos
    const validarCampos = () => {
        // Validar campos obligatorios
        if (!usuario.nombre.trim()) {
            Alert.alert('Error', 'El nombre es obligatorio');
            return false;
        }
        if (!usuario.correo.trim()) {
            Alert.alert('Error', 'El correo electrónico es obligatorio');
            return false;
        }
        if (!usuario.contraseña.trim()) {
            Alert.alert('Error', 'La contraseña es obligatoria');
            return false;
        }
        if (!usuario.confirmarContraseña.trim()) {
            Alert.alert('Error', 'Confirmar contraseña es obligatorio');
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

        // Validar longitud de contraseña
        if (usuario.contraseña.length < 6) {
            Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
            return false;
        }

        // Validar que las contraseñas coincidan
        if (usuario.contraseña !== usuario.confirmarContraseña) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
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

    // Función para registrar el usuario
    const registrarUsuario = async () => {
        if (!validarCampos()) {
            return;
        }

        setCargando(true);
        console.log('🚀 INICIANDO PROCESO DE REGISTRO');

        try {
            // 1. Crear usuario en Firebase Auth
            console.log('📝 Creando usuario en Authentication...');
            const userCredential = await createUserWithEmailAndPassword(
                auth, 
                usuario.correo, 
                usuario.contraseña
            );
            
            const user = userCredential.user;
            console.log('✅ Usuario creado en Auth:', user.uid);
            console.log('📧 Email:', user.email);

            // 2. Actualizar el perfil con el nombre
            console.log('👤 Actualizando displayName...');
            await updateProfile(user, {
                displayName: usuario.nombre
            });
            console.log('✅ DisplayName actualizado:', user.displayName);

            // 3. Preparar datos completos para Firestore
            console.log('=== 💾 GUARDANDO EN FIRESTORE ===');
            console.log('🔥 Database object existe?:', !!database);
            console.log('🆔 User UID:', user.uid);
            
            // ✅ CORRECCIÓN 1: Estructura completa de datos
            const userData = {
                // Información básica
                uid: user.uid,
                nombre: usuario.nombre.trim(),
                correo: usuario.correo.toLowerCase().trim(),
                edad: parseInt(usuario.edad),
                especialidad: usuario.especialidad.trim(),
                
                // Información de autenticación (solo para referencia)
                email: user.email, // Email de Firebase Auth
                displayName: user.displayName, // Display name de Firebase Auth
                
                // Metadatos
                fechaRegistro: new Date(),
                fechaCreacion: new Date().toISOString(),
                activo: true,
                verificado: user.emailVerified || false,
                
                // Información adicional útil
                plataforma: Platform.OS, // 'android' o 'ios'
                version: '1.0.0', // Versión de tu app
                ultimaActualizacion: new Date().toISOString()
            };
            
            console.log('📦 Datos completos a guardar:', userData);
            console.log('📋 Campos incluidos:', Object.keys(userData));

            // ✅ CORRECCIÓN 2: Referencia correcta del documento (solo UID)
            const docRef = doc(database, 'usuarios', user.uid);


            console.log('📍 Document reference creada:', docRef.path);
            console.log('🗂️ Collection: usuarios');
            console.log('📄 Document ID:', user.uid);

            // ✅ CORRECCIÓN 3: Test de conectividad simplificado
            console.log('🧪 EJECUTANDO TEST DE ESCRITURA...');
            try {
                const testRef = doc(database, 'usuarios', user.uid);
                const testData = { 
                    timestamp: new Date(),
                    test: 'conexion_exitosa',
                    uid: user.uid,
                    platform: Platform.OS
                };
     
               const test = await setDoc(docRef, userData);

               console.log('📄 Documento de test escrito:', test);
                console.log('✅ Test de escritura EXITOSO');
                
                // Verificar el test inmediatamente
                const testVerify = await getDoc(testRef);
                if (testVerify.exists()) {
                    console.log('✅ Test verificado - Firestore funciona correctamente');
                } else {
                    console.log('⚠️ Test no se pudo verificar');
                }
                
            } catch (testError) {
                console.log('❌ Test de escritura FALLÓ:', testError.message);
                throw new Error(`Error de conectividad con Firestore: ${testError.message}`);
            }

            // ✅ CORRECCIÓN 4: Guardar datos completos del usuario
            console.log('⏳ Guardando datos completos del usuario...');
            await setDoc(docRef, userData, { merge: false }); // merge: false para sobrescribir completamente
            console.log('✅ setDoc ejecutado sin errores - TODOS los datos guardados');
            
            // ✅ CORRECCIÓN 5: Verificación completa
            console.log('🔍 Verificando que TODOS los datos se guardaron...');
            const verificacion = await getDoc(docRef);
            
            if (verificacion.exists()) {
                const datosVerificados = verificacion.data();
                console.log('✅ DOCUMENTO EXISTE - Verificando campos:');
                console.log('🎯 UID:', datosVerificados.uid);
                console.log('🎯 Nombre:', datosVerificados.nombre);
                console.log('🎯 Correo:', datosVerificados.correo);
                console.log('🎯 Edad:', datosVerificados.edad);
                console.log('🎯 Especialidad:', datosVerificados.especialidad);
                console.log('🎯 Fecha de registro:', datosVerificados.fechaRegistro);
                console.log('🎯 Activo:', datosVerificados.activo);
                console.log('🎯 Plataforma:', datosVerificados.plataforma);
                
                // Verificar que TODOS los campos esperados existen
                const camposEsperados = ['uid', 'nombre', 'correo', 'edad', 'especialidad', 'fechaRegistro', 'activo'];
                const camposFaltantes = camposEsperados.filter(campo => !(campo in datosVerificados));
                
                if (camposFaltantes.length > 0) {
                    console.log('⚠️ CAMPOS FALTANTES:', camposFaltantes);
                    Alert.alert('Advertencia', `Algunos datos no se guardaron: ${camposFaltantes.join(', ')}`);
                } else {
                    console.log('✅ TODOS LOS CAMPOS GUARDADOS CORRECTAMENTE');
                }
                
                // Mostrar resumen de datos guardados
                console.log('📊 RESUMEN COMPLETO DE DATOS GUARDADOS:');
                console.table(datosVerificados);
                
            } else {
                console.log('❌ PROBLEMA CRÍTICO: DOCUMENTO NO EXISTE DESPUÉS DEL SETDOC');
                throw new Error('Los datos no se guardaron en Firestore');
            }
            
            console.log('✅ PROCESO DE FIRESTORE COMPLETADO EXITOSAMENTE');
            
            // Mostrar mensaje de éxito
            showToast('¡Registro exitoso! Todos los datos guardados.');
            
            // Limpiar formulario
            setUsuario({
                nombre: '',
                correo: '',
                contraseña: '',
                confirmarContraseña: '',
                edad: '',
                especialidad: ''
            });

            // Navegar al Home después de un breve delay
            console.log('🚀 Navegando a Home...');
            setTimeout(() => {
                navigation.replace('Home');
            }, 1500);
            
        } catch (error) {
            console.log('=== ❌ ERROR EN REGISTRO ===');
            console.log('Error completo:', error);
            console.log('Error name:', error.name);
            console.log('Error code:', error.code);
            console.log('Error message:', error.message);
            
            // Manejar errores específicos de Firebase Auth
            let errorMessage = 'Ocurrió un error al registrar el usuario';
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Este correo electrónico ya está registrado';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'El correo electrónico no es válido';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'La contraseña es muy débil';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Error de conexión. Verifica tu internet';
                    break;
                case 'firestore/permission-denied':
                    errorMessage = 'Error de permisos en Firestore. Verifica las reglas de seguridad';
                    break;
                case 'firestore/unavailable':
                    errorMessage = 'Firestore no está disponible. Intenta más tarde';
                    break;
                case 'firestore/deadline-exceeded':
                    errorMessage = 'Tiempo de espera agotado. Verifica tu conexión';
                    break;
                default:
                    errorMessage = error.message || 'Error desconocido durante el registro';
            }
            
            Alert.alert('Error de Registro', errorMessage);
            
            // Si el usuario se creó en Auth pero falló Firestore, informar
            if (error.message && error.message.includes('Firestore') && auth.currentUser) {
                Alert.alert(
                    'Usuario creado parcialmente', 
                    'Tu cuenta se creó en Firebase Auth, pero hubo un problema guardando los datos adicionales. Puedes intentar iniciar sesión.'
                );
            }
            
        } finally {
            setCargando(false);
            console.log('🏁 PROCESO DE REGISTRO FINALIZADO');
        }
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
                            <Text style={styles.logoIcon}>👤</Text>
                        </View>
                        <Text style={styles.title}>Crear Cuenta</Text>
                        <Text style={styles.subtitle}>Regístrate para comenzar</Text>
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
                                editable={!cargando}
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
                                editable={!cargando}
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
                                editable={!cargando}
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
                                editable={!cargando}
                            />
                        </View>

                        {/* Campo Contraseña */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Contraseña *</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Mínimo 6 caracteres"
                                    placeholderTextColor="#999"
                                    onChangeText={text => setUsuario({ ...usuario, contraseña: text })}
                                    value={usuario.contraseña}
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

                        {/* Campo Confirmar Contraseña */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Confirmar Contraseña *</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Confirma tu contraseña"
                                    placeholderTextColor="#999"
                                    onChangeText={text => setUsuario({ ...usuario, confirmarContraseña: text })}
                                    value={usuario.confirmarContraseña}
                                    secureTextEntry={!mostrarConfirmarContraseña}
                                    editable={!cargando}
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

                        {/* Botón de Registro */}
                        <TouchableOpacity 
                            style={[styles.primaryButton, cargando && styles.buttonDisabled]} 
                            onPress={registrarUsuario}
                            disabled={cargando}
                        >
                            <Text style={styles.buttonText}>
                                {cargando ? 'Registrando...' : 'Crear Cuenta'}
                            </Text>
                        </TouchableOpacity>

                        {/* Link para ir al Login */}
                        <TouchableOpacity style={styles.linkContainer} onPress={goToLogin}>
                            <Text style={styles.linkText}>
                                ¿Ya tienes cuenta? <Text style={styles.linkBold}>Inicia Sesión</Text>
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

export default RegisterScreen;