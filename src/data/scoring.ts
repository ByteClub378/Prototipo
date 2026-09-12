// Regras de pontuação centralizadas. Nenhuma fase deve calcular pontos por
// conta própria — todas chamam useScore().addPoints(...) usando estes valores.
//
// Regra atual (intencionalmente simples):
//   Acerto        -> +100
//   Erro          -> -50 (o placar nunca fica negativo — ScoreContext trava em 0)
//   Tempo esgotado -> 0 (não conta como erro de resposta, só como oportunidade perdida)
//
// Um futuro bônus de velocidade pode entrar aqui como uma função
// getPointsForCorrectAnswer(responseTimeSeconds) sem precisar mexer nas fases.
export const POINTS_PER_CORRECT_ANSWER = 100;
export const POINTS_PER_INCORRECT_ANSWER = -50;