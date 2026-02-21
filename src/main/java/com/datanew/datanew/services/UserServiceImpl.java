package com.datanew.datanew.services;

import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.datanew.datanew.models.entities.User;
import com.datanew.datanew.repositories.UserRepository;

@Service
public class UserServiceImpl implements UserService{

private static final Logger logger = LoggerFactory.getLogger(UserServiceImpl.class);

@Autowired
private UserRepository repository;

@Autowired
private PasswordEncoder passwordEncoder;

@Override
@Transactional(readOnly = true)
public List<User> findAll() {
   logger.info("Finding all users");
   return (List<User>) repository.findAll();
}

@Override
@Transactional(readOnly = true)
public Optional<User> findById(Long id) {
    return repository.findById(id);
}

@Override
@Transactional
public User save(User user) {
   logger.info("Creating new user: {}", user.getUsername());
   // Hash password before saving
   user.setPassword(passwordEncoder.encode(user.getPassword()));
   User savedUser = repository.save(user);
   logger.info("User created successfully with id: {}", savedUser.getId());
   return savedUser;
}

@Override
@Transactional
public Optional<User> update(User user, Long id) {
    Optional<User> o = findById(id);
    if (o.isPresent()) {
        User userdb = o.orElseThrow();
        // Hash password if it's being updated
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            userdb.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        userdb.setIs_superuser(user.getIs_superuser());
        userdb.setUsername(user.getUsername());
        userdb.setFirst_name(user.getFirst_name());
        userdb.setLast_name(user.getLast_name());
        userdb.setEmail(user.getEmail());
        userdb.setIs_staff(user.getIs_staff());
        userdb.setIs_active(user.getIs_active());
        userdb.setDate_joined(user.getDate_joined());
        userdb.setBiografia(user.getBiografia());
        userdb.setEnlace(user.getEnlace());
        userdb.setEmpresa(user.getEmpresa());
        userdb.setTelefono(user.getTelefono());
        userdb.setPais(user.getPais());
        userdb.setEstado(user.getEstado());
userdb.setCiudad(user.getCiudad());
        userdb.setCodigoPostal(user.getCodigoPostal());
        userdb.setImagen(user.getImagen());

        return Optional.of(repository.save(userdb));
    }
    return Optional.empty();
}

@Override
@Transactional
public void remove(Long id) {
    logger.info("Deleting user with id: {}", id);
    repository.deleteById(id);
    logger.info("User deleted successfully");
}

}
