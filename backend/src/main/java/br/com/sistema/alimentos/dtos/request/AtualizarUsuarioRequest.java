package br.com.sistema.alimentos.dtos.request;

import br.com.sistema.alimentos.enums.UsuarioTipo;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record AtualizarUsuarioRequest(
        @NotBlank(message = "O nome e obrigatorio")
        String nome,

        @NotBlank(message = "O e-mail e obrigatorio")
        @Email(message = "Informe um e-mail valido")
        String email,

        @Pattern(regexp = "\\d{11}", message = "CPF deve conter 11 digitos")
        String cpf,

        @Size(min = 6, message = "A senha deve ter no minimo 6 caracteres")
        String senha,

        @NotNull(message = "O tipo de usuario e obrigatorio")
        UsuarioTipo tipo,

        LocalDateTime planoExpiraEm
) {}
